const { Router } = require("express");
const { asyncRoute, db, requiredString, rowsFromQuery } = require("../lib/db-helpers");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = Router();

function publicMask(row) {
  return {
    id: row.id,
    name: row.name,
    era: row.era,
    summary: row.summary,
    avatarUrl: row.avatar_url,
    characterSpec: row.character_spec,
    createdAt: row.created_at,
  };
}

router.get("/", asyncRoute(async (_req, res) => {
  const rows = await rowsFromQuery(
    "SELECT id, name, era, summary, avatar_url, character_spec, created_at FROM masks ORDER BY name"
  );
  res.json({ masks: rows.map(publicMask) });
}));

router.get("/:id", asyncRoute(async (req, res) => {
  const rows = await rowsFromQuery(
    "SELECT id, name, era, summary, avatar_url, character_spec, created_at FROM masks WHERE id = ? LIMIT 1",
    [req.params.id]
  );
  if (!rows?.length) return res.status(404).json({ error: "Mask not found" });
  res.json({ mask: publicMask(rows[0]) });
}));

router.post("/", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const { name, era, summary, avatarUrl, characterSpec } = req.body || {};
  const result = await db.execute(
    "INSERT INTO masks (name, era, summary, avatar_url, character_spec) VALUES (?, ?, ?, ?, ?)",
    [
      requiredString(name, "name", 160),
      typeof era === "string" ? era.trim().slice(0, 160) : null,
      typeof summary === "string" ? summary.trim().slice(0, 2000) : null,
      typeof avatarUrl === "string" ? avatarUrl.trim().slice(0, 2000) : null,
      requiredString(characterSpec, "characterSpec", 12000),
    ]
  );
  const id = result?.insertId || result?.id;
  res.status(201).json({ id, name: name.trim() });
}));

module.exports = router;
