const { Router } = require("express");
const { asyncRoute, db, rowsFromQuery } = require("../lib/db-helpers");

const router = Router();

router.get("/", asyncRoute(async (req, res) => {
  const rows = await rowsFromQuery(
    `SELECT m.id, m.name, m.era, m.summary, m.avatar_url, m.character_spec, m.created_at, t.created_at AS saved_at
     FROM user_twins t JOIN masks m ON m.id = t.mask_id
     WHERE t.user_id = ? ORDER BY t.created_at DESC`,
    [req.user.id]
  );
  res.json({ twins: rows.map((row) => ({
    id: row.id,
    name: row.name,
    era: row.era,
    summary: row.summary,
    avatarUrl: row.avatar_url,
    characterSpec: row.character_spec,
    createdAt: row.created_at,
    savedAt: row.saved_at,
  })) });
}));

router.post("/:maskId", asyncRoute(async (req, res) => {
  const masks = await rowsFromQuery("SELECT id FROM masks WHERE id = ? LIMIT 1", [req.params.maskId]);
  if (!masks?.length) return res.status(404).json({ error: "Mask not found" });
  await db.execute(
    "INSERT INTO user_twins (user_id, mask_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE mask_id = VALUES(mask_id)",
    [req.user.id, req.params.maskId]
  );
  res.status(201).json({ saved: true, maskId: req.params.maskId });
}));

router.delete("/:maskId", asyncRoute(async (req, res) => {
  await db.execute("DELETE FROM user_twins WHERE user_id = ? AND mask_id = ?", [req.user.id, req.params.maskId]);
  res.json({ saved: false, maskId: req.params.maskId });
}));

module.exports = router;
