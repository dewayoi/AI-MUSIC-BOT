const groq = require("../clients/groq");

async function generateTitle(messages, model) {
  console.log(`[API] Requesting title from Groq...`);
  const response = await groq.chat.completions.create({
    model: model,
    messages: messages,
  });

  console.log(`[API] Title received.`);
  return response.choices[0].message.content;
}

module.exports = { generateTitle };
