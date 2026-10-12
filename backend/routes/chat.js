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

router.post("/:id/chat", chatLimiter, asyncRoute(async (req, res) => {
  const userMessage = requiredString(req.body?.message, "message", 8000);
  const requestedConversationId = req.body?.conversationId || null;
  const masks = await rowsFromQuery(
    "SELECT id, name, era, character_spec FROM masks WHERE id = ? LIMIT 1",
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
    const created = await db.execute(
      "INSERT INTO conversations (mask_id, user_id) VALUES (?, ?)",
      [mask.id, req.user.id]
    );
    conversationId = created?.insertId || created?.id;
  }
  if (!conversationId) throw new Error("Could not create conversation");

  const history = await rowsFromQuery(
    "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 20",
    [conversationId]
  );
  const reply = await generatePersonaReply(mask, (history || []).reverse(), userMessage);

  await db.execute(
    "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?), (?, 'assistant', ?)",
    [conversationId, userMessage, conversationId, reply]
  );
  res.json({ conversationId, reply });
}));

module.exports = router;
