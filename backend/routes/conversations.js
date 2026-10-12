const { Router } = require("express");
const { asyncRoute, rowsFromQuery } = require("../lib/db-helpers");

const router = Router();

// GET /api/conversations
router.get("/", asyncRoute(async (req, res) => {
  const rows = await rowsFromQuery(
    `SELECT c.id, c.mask_id, c.created_at, m.name AS mask_name,
      (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_message
     FROM conversations c JOIN masks m ON m.id = c.mask_id
     WHERE c.user_id = ? ORDER BY c.id DESC`,
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

// GET /api/conversations/:id/messages
router.get("/:id/messages", asyncRoute(async (req, res) => {
  const conversation = await rowsFromQuery(
    "SELECT id FROM conversations WHERE id = ? AND user_id = ? LIMIT 1",
    [req.params.id, req.user.id]
  );
  if (!conversation?.length) return res.status(404).json({ error: "Conversation not found" });
  const rows = await rowsFromQuery(
    "SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC",
    [req.params.id]
  );
  res.json({ messages: rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  })) });
}));

module.exports = router;
