const { getMetadataProvider } = require("../providers/metadata");

async function generateMetadata(title, genre, mood) {
  const provider = getMetadataProvider();
  const messages = [
    {
      role: "system",
      content: "You are a YouTube music SEO expert.",
    },
    {
      role: "user",
      content: `
Create YouTube metadata.

Title:
${title}

Genre:
${genre}

Mood:
${mood}

Generate:

1. YouTube description
2. Tags
3. Thumbnail image prompt
`,
    },
  ];
  const model = "llama-3.3-70b-versatile";
  return provider.generateMetadata(messages, model);
}

module.exports = generateMetadata;
