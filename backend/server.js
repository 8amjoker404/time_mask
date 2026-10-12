require("dotenv").config();

const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const { requireAuth, assertAuthConfig } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const twinsRoutes = require("./routes/twins");
const groupsRoutes = require("./routes/groups");
const maskRoutes = require("./routes/masks");
const conversationRoutes = require("./routes/conversations");
const chatRoutes = require("./routes/chat");
const settingsRoutes = require("./routes/settings");
const adminRoutes = require("./routes/admin");
const db = require("./database");

const app = express();
const port = Number(process.env.PORT || 4001);
assertAuthConfig();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "1mb" }));

// GET /health
app.get("/health", async (_req, res, next) => {
  try {
    const database = await db.status();
    res.json({ ok: true, database });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message || "SQL database unavailable" });
  }
});

// Mount authentication routes at /api/auth.
app.use("/api/auth", authRoutes);
// Mount mask collection and character creation routes at /api/masks.
app.use("/api/masks", maskRoutes);
// Mount authenticated mask chat routes at /api/masks.
app.use("/api/masks", requireAuth, chatRoutes);
// Mount authenticated conversation routes at /api/conversations.
app.use("/api/conversations", requireAuth, conversationRoutes);
// Mount authenticated saved twin routes at /api/twins.
app.use("/api/twins", requireAuth, twinsRoutes);
// Mount authenticated group chat routes at /api/groups.
app.use("/api/groups", requireAuth, groupsRoutes);
// Mount model settings routes at /api/settings.
app.use("/api/settings", settingsRoutes);
// Mount administrator user and character management routes at /api/admin.
app.use("/api/admin", adminRoutes);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use((error, _req, res, _next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body must be valid JSON" });
  }
  if (error.message === "Origin is not allowed by CORS") {
    return res.status(403).json({ error: error.message });
  }
  console.error(error);
  return res.status(error.status || 500).json({ error: error.message || "Internal server error" });
});

app.listen(port, () => console.log(`Time Mask API listening on port http://localhost:${port}`));
