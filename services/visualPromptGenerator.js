const { getVisualPromptProvider } = require("../providers/visual");

async function generateVisualPrompt(genre, mood) {
  const provider = getVisualPromptProvider();
  const model = "llama-3.3-70b-versatile";
  const messages = [
    {
      role: "system",
      content: "You are an expert AI art prompt creator.",
    },
    {
      role: "user",
      content: `
Create cinematic artwork prompt.

Genre:
${genre}

Mood:
${mood}

Style:
YouTube music thumbnail.
High quality.
Cinematic lighting.
No text.
`,
    },
  ];
  return provider.generateVisualPrompt(messages, model);
}

module.exports = generateVisualPrompt;
