const { Router } = require("express");
const { rateLimit } = require("express-rate-limit");
const { asyncRoute, db, requiredString, rowsFromQuery } = require("../lib/db-helpers");
const { generatePersonaReply } = require("../services/llm");

const router = Router();
const groupChatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });

// GET /api/groups
router.get("/", asyncRoute(async (req, res) => {
  const rows = await rowsFromQuery(
    `SELECT g.id, g.name, g.created_at,
      (SELECT COUNT(*) FROM chat_group_members gm WHERE gm.group_id = g.id) AS member_count,
      (SELECT content FROM chat_group_messages WHERE group_id = g.id ORDER BY id DESC LIMIT 1) AS last_message
     FROM chat_groups g WHERE g.user_id = ? ORDER BY g.id DESC`,
    [req.user.id]
  );
  res.json({ groups: rows.map((row) => ({
    id: row.id,
    name: row.name,
    memberCount: Number(row.member_count),
    lastMessage: row.last_message,
    createdAt: row.created_at,
  })) });
}));

// POST /api/groups
router.post("/", asyncRoute(async (req, res) => {
  const name = requiredString(req.body?.name, "name", 120);
  const maskIds = [...new Set(Array.isArray(req.body?.maskIds) ? req.body.maskIds.map(String) : [])];
  if (!maskIds.length || maskIds.length > 6) {
    return res.status(400).json({ error: "Choose between 1 and 6 historical masks" });
  }
  const masks = await rowsFromQuery("SELECT id FROM masks WHERE id IN (?) AND owner_user_id IS NULL", [maskIds]);
  if (masks.length !== maskIds.length) return res.status(400).json({ error: "One or more selected masks were not found" });
  const created = await db.execute("INSERT INTO chat_groups (user_id, name) VALUES (?, ?)", [req.user.id, name]);
  const groupId = created.insertId;
  for (const mask of masks) {
    await db.execute("INSERT INTO chat_group_members (group_id, mask_id) VALUES (?, ?)", [groupId, mask.id]);
  }
  res.status(201).json({ group: { id: groupId, name, memberCount: masks.length } });
}));

// GET /api/groups/:id/members
router.get("/:id/members", asyncRoute(async (req, res) => {
  const owned = await rowsFromQuery("SELECT id FROM chat_groups WHERE id = ? AND user_id = ? LIMIT 1", [req.params.id, req.user.id]);
  if (!owned?.length) return res.status(404).json({ error: "Group chat not found" });
  const members = await rowsFromQuery(
    `SELECT m.id, m.name, m.era, m.profession, m.summary
     FROM chat_group_members gm JOIN masks m ON m.id = gm.mask_id
     WHERE gm.group_id = ? ORDER BY gm.id ASC`,
    [req.params.id]
  );
  res.json({ members });
}));

// GET /api/groups/:id/messages
router.get("/:id/messages", asyncRoute(async (req, res) => {
  const owned = await rowsFromQuery("SELECT id FROM chat_groups WHERE id = ? AND user_id = ? LIMIT 1", [req.params.id, req.user.id]);
  if (!owned?.length) return res.status(404).json({ error: "Group chat not found" });
  const rows = await rowsFromQuery(
    `SELECT gm.id, gm.role, gm.mask_id, m.name AS mask_name, gm.content, gm.created_at
     FROM chat_group_messages gm LEFT JOIN masks m ON m.id = gm.mask_id
     WHERE gm.group_id = ? ORDER BY gm.id ASC`,
    [req.params.id]
  );
  res.json({ messages: rows.map((row) => ({
    id: row.id,
    role: row.role,
    maskId: row.mask_id,
    maskName: row.mask_name,
    content: row.content,
    createdAt: row.created_at,
  })) });
}));

// POST /api/groups/:id/messages
router.post("/:id/messages", groupChatLimiter, asyncRoute(async (req, res) => {
  const text = requiredString(req.body?.message, "message", 8000);
  const groups = await rowsFromQuery("SELECT id FROM chat_groups WHERE id = ? AND user_id = ? LIMIT 1", [req.params.id, req.user.id]);
  if (!groups?.length) return res.status(404).json({ error: "Group chat not found" });
  let masks = await rowsFromQuery(
    `SELECT m.id, m.name, m.era, m.profession, m.summary, m.character_spec FROM chat_group_members gm
     JOIN masks m ON m.id = gm.mask_id WHERE gm.group_id = ? ORDER BY gm.id ASC`,
    [req.params.id]
  );
  const history = await rowsFromQuery(
    `SELECT gm.role, gm.mask_id, m.name AS mask_name, gm.content
     FROM chat_group_messages gm LEFT JOIN masks m ON m.id = gm.mask_id
     WHERE gm.group_id = ? ORDER BY gm.id DESC LIMIT 24`,
    [req.params.id]
  );
  const orderedHistory = (history || []).reverse().map((row) => ({
    role: row.role,
    speaker: row.role === "assistant" ? row.mask_name || "A group member" : undefined,
    content: row.content,
  }));

  const mentionedMasks = masks.filter((mask) => text.toLocaleLowerCase().includes(`@${mask.name}`.toLocaleLowerCase()));
  const tagged = mentionedMasks.length > 0;
  if (tagged) masks = mentionedMasks;
  else {
    const lastSpeaker = [...orderedHistory].reverse().find((message) => message.role === "assistant")?.speaker;
    const lastSpeakerIndex = masks.findIndex((mask) => mask.name === lastSpeaker);
    if (lastSpeakerIndex >= 0) masks = [...masks.slice(lastSpeakerIndex + 1), ...masks.slice(0, lastSpeakerIndex + 1)];
  }

  const replies = [];
  const context = [...orderedHistory];
  for (const mask of masks) {
    if (!tagged && replies.length >= 2) break;
    const content = await generatePersonaReply(mask, context, text, null, {
      groupChat: true,
      mentioned: tagged,
      messageInHistory: context.some((message) => message.role === "user" && message.content === text),
    });
    if (content.trim() === "[[PASS]]") continue;
    const reply = { mask, content };
    replies.push(reply);
    if (!context.some((message) => message.role === "user" && message.content === text)) {
      context.push({ role: "user", content: text });
    }
    context.push({ role: "assistant", speaker: mask.name, content });
  }
  await db.execute("INSERT INTO chat_group_messages (group_id, role, content) VALUES (?, 'user', ?)", [req.params.id, text]);
  for (const reply of replies) {
    await db.execute(
      "INSERT INTO chat_group_messages (group_id, role, mask_id, content) VALUES (?, 'assistant', ?, ?)",
      [req.params.id, reply.mask.id, reply.content]
    );
  }
  res.json({ messages: replies.map(({ mask, content }) => ({ role: "assistant", maskId: mask.id, maskName: mask.name, content })) });
}));

module.exports = router;
