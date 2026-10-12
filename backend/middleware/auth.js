const jwt = require("jsonwebtoken");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("replace-with-")) {
    throw new Error("JWT_SECRET must be set to a random value with at least 32 characters");
  }
  return secret;
}

function createToken(user) {
  return jwt.sign(
    { role: user.role, email: user.email },
    getJwtSecret(),
    { subject: String(user.id), expiresIn: process.env.JWT_EXPIRES_IN || "7d", algorithm: "HS256" }
  );
}

function assertAuthConfig() {
  getJwtSecret();
}

function requireAuth(req, res, next) {
  const value = req.get("authorization") || "";
  const [scheme, token] = value.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Sign in to continue" });
  }
  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: "Session expired or invalid. Sign in again." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Administrator access required" });
  }
  return next();
}

module.exports = { createToken, requireAuth, requireAdmin, assertAuthConfig };
