const groq = require("../clients/groq");

async function generateMetadata(messages, model) {
  console.log(`[API] Requesting metadata from Groq...`);
  const response = await groq.chat.completions.create({
    model: model,
    messages: messages,
  });

  console.log(`[API] Metadata received.`);
  return response.choices[0].message.content;
}

module.exports = { generateMetadata };
