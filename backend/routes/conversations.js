const { Router } = require("express");
const { asyncRoute, db, rowsFromQuery } = require("../lib/db-helpers");

const router = Router();

// GET /api/conversations
router.get("/", asyncRoute(async (req, res) => {
  const rows = await rowsFromQuery(
    `SELECT c.id, c.mask_id, c.created_at, m.name AS mask_name,
      (SELECT msg.content FROM messages msg JOIN conversations prior ON prior.id = msg.conversation_id
       WHERE prior.user_id = c.user_id AND prior.mask_id = c.mask_id ORDER BY msg.id DESC LIMIT 1) AS last_message
     FROM conversations c JOIN masks m ON m.id = c.mask_id
     WHERE c.user_id = ?
       AND c.id = (SELECT MAX(latest.id) FROM conversations latest WHERE latest.user_id = c.user_id AND latest.mask_id = c.mask_id)
     ORDER BY c.id DESC`,
    [req.user.id]
  );
  res.json({ conversations: rows.map((row) => ({
    id: row.id,
    maskId: row.mask_id,
    maskName: row.mask_name,
    lastMessage: row.last_message,
    createdAt: row.created_at,
  })) });
}));

// DELETE /api/conversations/history — clear all personal and group chat history.
router.delete("/history", asyncRoute(async (req, res) => {
  await db.execute(
    "DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = ?)",
    [req.user.id]
  );
  await db.execute(
    "DELETE FROM chat_group_messages WHERE group_id IN (SELECT id FROM chat_groups WHERE user_id = ?)",
    [req.user.id]
  );
  await db.execute(
    "UPDATE user_twins SET interview_answers = NULL, interview_completed_at = NULL WHERE user_id = ?",
    [req.user.id]
  );
  res.json({ ok: true });
}));

// GET /api/conversations/by-mask/:maskId — resume this user's conversation with a character.
router.get("/by-mask/:maskId", asyncRoute(async (req, res) => {
  const rows = await rowsFromQuery(
    "SELECT id FROM conversations WHERE user_id = ? AND mask_id = ? ORDER BY id DESC LIMIT 1",
    [req.user.id, req.params.maskId]
  );
  const conversationId = rows?.[0]?.id || null;
  if (!conversationId) return res.json({ conversationId: null, messages: [] });

  const messages = await rowsFromQuery(
    `SELECT msg.id, msg.role, msg.content, msg.created_at FROM messages msg
     JOIN conversations c ON c.id = msg.conversation_id
     WHERE c.user_id = ? AND c.mask_id = ? ORDER BY msg.id ASC`,
    [req.user.id, req.params.maskId]
  );
  res.json({
    conversationId,
    messages: messages.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    })),
  });
}));

// GET /api/conversations/:id/messages
router.get("/:id/messages", asyncRoute(async (req, res) => {
  const conversation = await rowsFromQuery(
    "SELECT id FROM conversations WHERE id = ? AND user_id = ? LIMIT 1",
    [req.params.id, req.user.id]
  );
  if (!conversation?.length) return res.status(404).json({ error: "Conversation not found" });
  const rows = await rowsFromQuery(
    `SELECT msg.id, msg.role, msg.content, msg.created_at FROM messages msg
     JOIN conversations c ON c.id = msg.conversation_id
     WHERE c.user_id = ? AND c.mask_id = (
       SELECT mask_id FROM conversations WHERE id = ? AND user_id = ? LIMIT 1
     ) ORDER BY msg.id ASC`,
    [req.user.id, req.params.id, req.user.id]
  );
  res.json({ messages: rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  })) });
}));

// DELETE /api/conversations/:id — clear a character's one-to-one chat thread.
router.delete("/:id", asyncRoute(async (req, res) => {
  const conversations = await rowsFromQuery(
    "SELECT mask_id FROM conversations WHERE id = ? AND user_id = ? LIMIT 1",
    [req.params.id, req.user.id]
  );
  if (!conversations?.length) return res.status(404).json({ error: "Conversation not found" });
  await db.execute(
    "DELETE FROM conversations WHERE user_id = ? AND mask_id = ?",
    [req.user.id, conversations[0].mask_id]
  );
  res.json({ ok: true });
}));

module.exports = router;
