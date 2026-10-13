const { buildPersonaPrompt } = require("./persona-prompt");

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function isTemporaryCapacityError(status, message = "") {
  return status === 429 || status === 503 || /high demand|overload|capacity|temporarily unavailable|try again later/i.test(message);
}

function getModels() {
  const primary = process.env.GOOGLE_MODEL || "gemini-3.8-flash";
  const fallbacks = (process.env.GOOGLE_MODEL_FALLBACKS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set([primary, ...fallbacks])];
}

async function generatePersonaReply(mask, history, userMessage, userProfile = null) {
  const apiKey = process.env.RUNTIME_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    const error = new Error("Google API key is not configured. Ask an administrator to update the AI settings.");
    error.status = 503;
    throw error;
  }

  const models = getModels();
  const transcript = [...(history || []), { role: "user", content: userMessage }]
    .map((message) => `${message.role === "assistant" ? mask.name : "Visitor"}: ${message.content}`)
    .join("\n\n");
  let generated;
  let response;
  let lastError;
  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
              model,
              system_instruction: buildPersonaPrompt(mask, userProfile),
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
      lastError = new Error(message);
      lastError.status = isTemporaryCapacityError(response.status, message) ? 503 : 502;
      if (!isTemporaryCapacityError(response.status, message)) throw lastError;
      if (attempt === 0) await sleep(700);
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
