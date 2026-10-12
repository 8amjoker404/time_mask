const { Router } = require("express");
const { rateLimit } = require("express-rate-limit");
const { asyncRoute, db, requiredString, rowsFromQuery } = require("../lib/db-helpers");
const { generatePersonaReply } = require("../services/llm");

const router = Router();
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Please wait a moment before sending another message" },
});

// POST /api/masks/:id/chat
router.post("/:id/chat", chatLimiter, asyncRoute(async (req, res) => {
  const userMessage = requiredString(req.body?.message, "message", 8000);
  const requestedConversationId = req.body?.conversationId || null;
  const masks = await rowsFromQuery(
    "SELECT id, name, era, profession, character_spec FROM masks WHERE id = ? LIMIT 1",
    [req.params.id]
  );
  const mask = masks?.[0];
  if (!mask) return res.status(404).json({ error: "Mask not found" });

  let conversationId = requestedConversationId;
  if (conversationId) {
    const owned = await rowsFromQuery(
      "SELECT id FROM conversations WHERE id = ? AND user_id = ? AND mask_id = ? LIMIT 1",
      [conversationId, req.user.id, mask.id]
    );
    if (!owned?.length) return res.status(404).json({ error: "Conversation not found" });
  } else {
    const existing = await rowsFromQuery(
      "SELECT id FROM conversations WHERE mask_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1",
      [mask.id, req.user.id]
    );
    conversationId = existing?.[0]?.id;
    if (!conversationId) {
      const created = await db.execute(
        "INSERT INTO conversations (mask_id, user_id) VALUES (?, ?)",
        [mask.id, req.user.id]
      );
      conversationId = created?.insertId || created?.id;
    }
  }
  if (!conversationId) throw new Error("Could not create conversation");

  const history = await rowsFromQuery(
    `SELECT msg.role, msg.content FROM messages msg
     JOIN conversations c ON c.id = msg.conversation_id
     WHERE c.user_id = ? AND c.mask_id = ? ORDER BY msg.id DESC LIMIT 40`,
    [req.user.id, mask.id]
  );
  const reply = await generatePersonaReply(mask, (history || []).reverse(), userMessage);

  await db.execute(
    "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?), (?, 'assistant', ?)",
    [conversationId, userMessage, conversationId, reply]
  );
  res.json({ conversationId, reply });
}));

module.exports = router;
