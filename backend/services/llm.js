const { buildPersonaPrompt } = require("./persona-prompt");

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function isTemporaryCapacityError(status, message = "") {
  return status === 429 || status === 503 || /high demand|overload|capacity|temporarily unavailable|try again later/i.test(message);
}

function capacityError() {
  const error = new Error("The AI is busy right now. Please try sending your message again in a minute.");
  error.status = 503;
  error.code = "AI_TEMPORARILY_UNAVAILABLE";
  return error;
}

function getModels() {
  const primary = process.env.RUNTIME_GOOGLE_MODEL || process.env.GOOGLE_MODEL || "gemini-3.8-flash";
  const fallbacks = (process.env.GOOGLE_MODEL_FALLBACKS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set([primary, ...fallbacks])];
}

function getActiveProvider() {
  return process.env.RUNTIME_LLM_PROVIDER || process.env.LLM_PROVIDER || "google";
}

function parseResponseError(status, message, provider) {
  const error = new Error(message || `${provider} AI request failed`);
  if (isTemporaryCapacityError(status, message)) {
    error.message = "The AI is busy right now. Please try sending your message again in a minute.";
    error.status = 503;
    error.code = "AI_TEMPORARILY_UNAVAILABLE";
  } else {
    error.status = 502;
  }
  return error;
}

async function generateOpenAIReply(mask, transcript, userProfile, options) {
  const apiKey = process.env.RUNTIME_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("OpenAI API key is not configured. Ask an administrator to update the AI settings.");
    error.status = 503;
    throw error;
  }
  const model = process.env.RUNTIME_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  let response;
  let generated;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          instructions: buildPersonaPrompt(mask, userProfile, options),
          input: transcript,
          max_output_tokens: 1200,
        }),
      });
      generated = await response.json();
    } catch (cause) {
      const error = new Error("Could not reach OpenAI. Please try again shortly.", { cause });
      error.status = 502;
      throw error;
    }
    if (response.ok) break;
    const message = generated?.error?.message || "OpenAI request failed";
    const error = parseResponseError(response.status, message, "OpenAI");
    if (error.code !== "AI_TEMPORARILY_UNAVAILABLE") throw error;
    if (attempt === 2) throw error;
    await sleep(800 * (2 ** attempt));
  }
  const reply = generated?.output_text?.trim()
    || generated?.output?.flatMap((item) => item.content || [])
      .filter((part) => part.type === "output_text")
      .map((part) => part.text || "")
      .join("")
      .trim();
  if (!reply) throw new Error("OpenAI returned an empty response");
  return reply;
}

async function generatePersonaReply(mask, history, userMessage, userProfile = null, options = {}) {
  const provider = getActiveProvider();
  const transcriptMessages = options.messageInHistory
    ? (history || [])
    : [...(history || []), { role: "user", content: userMessage }];
  const transcript = transcriptMessages
    .map((message) => `${message.role === "assistant" ? (message.speaker || mask.name) : "Visitor"}: ${message.content}`)
    .join("\n\n");
  if (provider === "openai") return generateOpenAIReply(mask, transcript, userProfile, options);

  const apiKey = process.env.RUNTIME_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    const error = new Error("Google API key is not configured. Ask an administrator to update the AI settings.");
    error.status = 503;
    throw error;
  }

  const models = getModels();
  let generated;
  let response;
  let lastError;
  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
              model,
              system_instruction: buildPersonaPrompt(mask, userProfile, options),
              input: transcript,
              generation_config: { max_output_tokens: 1200, thinking_level: "low" },
            }),
          }
        );
        generated = await response.json();
      } catch (cause) {
        lastError = new Error("Could not reach Google AI. Please try again shortly.", { cause });
        lastError.status = 502;
        break;
      }

      if (response.ok) {
        lastError = null;
        break;
      }

      const message = generated?.error?.message || "Google AI request failed";
      if (isTemporaryCapacityError(response.status, message)) {
        lastError = capacityError();
        if (attempt < 2) await sleep(800 * (2 ** attempt));
      } else {
        lastError = new Error(message);
        lastError.status = 502;
        throw lastError;
      }
    }
    if (!lastError) break;
  }

  if (lastError) throw lastError;

  const reply = generated?.output_text?.trim()
    || generated?.steps?.filter((step) => step.type === "model_output")
      .flatMap((step) => step.content || [])
      .map((part) => part.text || "")
      .join("")
      .trim();
  if (!reply) throw new Error("Google AI returned an empty response");
  return reply;
}

module.exports = { generatePersonaReply };
