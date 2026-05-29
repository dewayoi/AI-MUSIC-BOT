const groq = require("../clients/groq");

async function generateVisualPrompt(messages, model) {
  console.log(`[API] Requesting visual prompt from Groq...`);
  const response = await groq.chat.completions.create({
    model: model,
    messages: messages,
  });

  console.log(`[API] Visual prompt received.`);
  return response.choices[0].message.content;
}

module.exports = { generateVisualPrompt };
