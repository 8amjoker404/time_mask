const { Router } = require("express");
const bcrypt = require("bcryptjs");
const { asyncRoute, db, requiredString, rowsFromQuery } = require("../lib/db-helpers");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = Router();
// Apply administrator authentication to every /api/admin route.
router.use(requireAuth, requireAdmin);

// GET /api/admin/users
router.get("/users", asyncRoute(async (_req, res) => {
  const users = await rowsFromQuery("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
  res.json({ users });
}));

// DELETE /api/admin/users/:id
router.delete("/users/:id", asyncRoute(async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ error: "You cannot delete your own administrator account" });
  const [result] = await db.execute("DELETE FROM users WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: "User not found" });
  res.json({ ok: true });
}));

// PUT /api/admin/users/:id/password
router.put("/users/:id/password", asyncRoute(async (req, res) => {
  const password = requiredString(req.body?.password, "password", 200);
  if (password.length < 10) return res.status(400).json({ error: "Password must be at least 10 characters" });
  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: "User not found" });
  res.json({ ok: true });
}));

// PUT /api/admin/masks/:id
router.put("/masks/:id", asyncRoute(async (req, res) => {
  const { name, era, profession, summary, avatarUrl, characterSpec } = req.body || {};
  const [result] = await db.execute(
    "UPDATE masks SET name = ?, era = ?, profession = ?, summary = ?, avatar_url = ?, character_spec = ? WHERE id = ? AND owner_user_id IS NULL",
    [requiredString(name, "name", 160), typeof era === "string" ? era.trim().slice(0, 160) || null : null,
      typeof profession === "string" ? profession.trim().slice(0, 160) || null : null,
      typeof summary === "string" ? summary.trim().slice(0, 2000) || null : null,
      typeof avatarUrl === "string" ? avatarUrl.trim().slice(0, 2000) || null : null,
      requiredString(characterSpec, "characterSpec", 12000), req.params.id]
  );
  if (!result.affectedRows) {
    const rows = await rowsFromQuery("SELECT id FROM masks WHERE id = ? AND owner_user_id IS NULL LIMIT 1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Character not found" });
  }
  res.json({ ok: true });
}));

// DELETE /api/admin/masks/:id
router.delete("/masks/:id", asyncRoute(async (req, res) => {
  const [result] = await db.execute("DELETE FROM masks WHERE id = ? AND owner_user_id IS NULL", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: "Character not found" });
  res.json({ ok: true });
}));

module.exports = router;
