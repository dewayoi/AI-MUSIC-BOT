const groq = require("../clients/groq");

async function generateLyrics(messages, model) {
  console.log(`[API] Requesting lyrics from Groq...`);
  const response = await groq.chat.completions.create({
    model: model,
    messages: messages,
  });

  console.log(`[API] Lyrics received.`);
  return response.choices[0].message.content;
}

module.exports = { generateLyrics };
