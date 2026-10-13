const { Router } = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { requiredString } = require("../lib/db-helpers");

const router = Router();
const defaults = {
  google: process.env.GOOGLE_MODEL || "gemini-3.8-flash",
  openai: process.env.OPENAI_MODEL || "gpt-4o-mini",
};
const defaultFallbacks = "gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash";

function getSettings() {
  const provider = process.env.RUNTIME_LLM_PROVIDER || process.env.LLM_PROVIDER || "google";
  const model = provider === "openai"
    ? process.env.RUNTIME_OPENAI_MODEL || defaults.openai
    : process.env.RUNTIME_GOOGLE_MODEL || defaults.google;
  const configured = provider === "openai"
    ? Boolean(process.env.RUNTIME_OPENAI_API_KEY || process.env.OPENAI_API_KEY)
    : Boolean(process.env.RUNTIME_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY);
  const fallbackModels = (process.env.GOOGLE_MODEL_FALLBACKS || defaultFallbacks)
    .split(",").map((value) => value.trim()).filter(Boolean);
  return { provider, model, configured, fallbackModels };
}

// GET /api/settings/llm
router.get("/llm", (_req, res) => {
  res.json({ ...getSettings(), models: defaults });
});

// PUT /api/settings/llm
router.put("/llm", requireAuth, requireAdmin, (req, res, next) => {
  try {
    const provider = req.body?.provider;
    if (!["google", "openai"].includes(provider)) {
      return res.status(400).json({ error: "Choose Google or OpenAI as the AI provider" });
    }
    const model = requiredString(req.body?.model, "model", 120);
    const apiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";
    if (apiKey.length > 500) return res.status(400).json({ error: "API key is too long" });
    process.env.RUNTIME_LLM_PROVIDER = provider;
    if (provider === "google") {
      process.env.RUNTIME_GOOGLE_MODEL = model;
      if (apiKey) process.env.RUNTIME_GOOGLE_API_KEY = apiKey;
    } else {
      process.env.RUNTIME_OPENAI_MODEL = model;
      if (apiKey) process.env.RUNTIME_OPENAI_API_KEY = apiKey;
    }
    return res.json({ ...getSettings(), models: defaults });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
