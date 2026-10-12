async function generatePersonaReply(mask, history, userMessage) {
  const apiKey = process.env.RUNTIME_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    const error = new Error("Google API key is not configured. Ask an administrator to update the AI settings.");
    error.status = 503;
    throw error;
  }

  const contents = [...(history || []), { role: "user", content: userMessage }]
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
  const model = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `You are Time Mask, an AI persona inspired by a historical figure. Speak in a vivid, thoughtful first-person voice consistent with the figure's known era and character. Never claim certainty about private thoughts or events unsupported by history; make clear when you are speculating.\n\nPersona: ${mask.name}${mask.era ? ` (${mask.era})` : ""}\nCharacter specification: ${mask.character_spec}` }],
        },
        contents,
        generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
      }),
    }
  );
  const generated = await response.json();
  if (!response.ok) {
    const error = new Error(generated?.error?.message || "Google AI request failed");
    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }
  const reply = generated?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!reply) throw new Error("Google AI returned an empty response");
  return reply;
}

module.exports = { generatePersonaReply };
