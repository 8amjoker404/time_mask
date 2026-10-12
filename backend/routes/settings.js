const { Router } = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { requiredString } = require("../lib/db-helpers");

const router = Router();
const model = process.env.GOOGLE_MODEL || "gemini-2.5-flash";

router.get("/llm", (_req, res) => {
  res.json({
    provider: "google",
    model,
    configured: Boolean(process.env.RUNTIME_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY),
  });
});

router.put("/llm", requireAuth, requireAdmin, (req, res, next) => {
  try {
    process.env.RUNTIME_GOOGLE_API_KEY = requiredString(req.body?.apiKey, "apiKey", 500);
    return res.json({ provider: "google", model, configured: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
