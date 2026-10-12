const { Router } = require("express");
const { rateLimit } = require("express-rate-limit");
const { asyncRoute, db, requiredString, rowsFromQuery } = require("../lib/db-helpers");

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
  const apiKey = process.env.RUNTIME_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    const error = new Error("Google API key is not configured. Ask an administrator to update the AI settings.");
    error.status = 503;
    throw error;
  }

  const contents = [...(history || []).reverse(), { role: "user", content: userMessage }]
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
  const model = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `You are Time Mask, an AI persona inspired by a historical figure. Speak in a vivid, thoughtful first-person voice consistent with the figure's known era and character. Never claim certainty about private thoughts or events unsupported by history; make clear when you are speculating.\n\nPersona: ${mask.name}${mask.era ? ` (${mask.era})` : ""}\nCharacter specification: ${mask.character_spec}` }],
        },
        contents,
        generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
      }),
    }
  );
  const generated = await response.json();
  if (!response.ok) {
    const error = new Error(generated?.error?.message || "Google AI request failed");
    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }
  const reply = generated?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!reply) throw new Error("Google AI returned an empty response");

  await db.execute(
    "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?), (?, 'assistant', ?)",
    [conversationId, userMessage, conversationId, reply]
  );
  res.json({ conversationId, reply });
}));

module.exports = router;
