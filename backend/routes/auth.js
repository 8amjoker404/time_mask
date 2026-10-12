const { Router } = require("express");
const bcrypt = require("bcryptjs");
const { rateLimit } = require("express-rate-limit");
const { asyncRoute, db, requiredString, rowsFromQuery } = require("../lib/db-helpers");
const { createToken, requireAuth } = require("../middleware/auth");

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Try again later." },
});

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function issueSession(res, user, status = 200) {
  return res.status(status).json({ token: createToken(user), user: publicUser(user) });
}

// POST /api/auth/register
router.post("/register", authLimiter, asyncRoute(async (req, res) => {
  const name = requiredString(req.body?.name, "name", 100);
  const email = requiredString(req.body?.email, "email", 254).toLowerCase();
  const password = requiredString(req.body?.password, "password", 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }
  if (password.length < 10) {
    return res.status(400).json({ error: "Password must be at least 10 characters" });
  }
  const existing = await rowsFromQuery("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (existing?.length) return res.status(409).json({ error: "An account with this email already exists" });

  const passwordHash = await bcrypt.hash(password, 12);
  await db.execute("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [name, email, passwordHash]);
  const rows = await rowsFromQuery("SELECT id, name, email, role FROM users WHERE email = ? LIMIT 1", [email]);
  if (!rows?.length) throw new Error("Account created but could not be loaded");
  return issueSession(res, rows[0], 201);
}));

// POST /api/auth/login
router.post("/login", authLimiter, asyncRoute(async (req, res) => {
  const email = requiredString(req.body?.email, "email", 254).toLowerCase();
  const password = requiredString(req.body?.password, "password", 200);
  const rows = await rowsFromQuery("SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1", [email]);
  const user = rows?.[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Email or password is incorrect" });
  }
  return issueSession(res, user);
}));

// GET /api/auth/me
router.get("/me", requireAuth, asyncRoute(async (req, res) => {
  const rows = await rowsFromQuery("SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1", [req.user.id]);
  if (!rows?.length) return res.status(401).json({ error: "Account no longer exists" });
  res.json({ user: publicUser(rows[0]) });
}));

// POST /api/auth/logout
router.post("/logout", requireAuth, (_req, res) => {
  // JWTs are stateless; clients discard their bearer token on logout.
  res.json({ ok: true });
});

module.exports = router;
