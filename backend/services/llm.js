async function generatePersonaReply(mask, history, userMessage) {
  const apiKey = process.env.RUNTIME_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    const error = new Error("Google API key is not configured. Ask an administrator to update the AI settings.");
    error.status = 503;
    throw error;
  }

  const model = process.env.GOOGLE_MODEL || "gemini-3.8-flash";
  const transcript = [...(history || []), { role: "user", content: userMessage }]
    .map((message) => `${message.role === "assistant" ? mask.name : "Visitor"}: ${message.content}`)
    .join("\n\n");
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        system_instruction: `You are Time Mask, an AI persona inspired by a historical figure. Speak in a vivid, thoughtful first-person voice consistent with the figure's known era and character. Keep a recognizable voice throughout this ongoing conversation. Notice the visitor's wording, warmth, formality, and preferred level of detail, and adapt naturally while remaining in character. Use earlier turns to remember what the visitor has shared and the tone you have established. Never claim certainty about private thoughts or events unsupported by history; make clear when you are speculating. Treat the transcript as conversation context and answer only the latest Visitor message without adding speaker labels.\n\nPersona: ${mask.name}${mask.era ? ` (${mask.era})` : ""}${mask.profession ? `, ${mask.profession}` : ""}\nCharacter specification: ${mask.character_spec}`,
        input: transcript,
        generation_config: { max_output_tokens: 1200, thinking_level: "low" },
      }),
    }
  );
  const generated = await response.json();
  if (!response.ok) {
    const error = new Error(generated?.error?.message || "Google AI request failed");
    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }
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
