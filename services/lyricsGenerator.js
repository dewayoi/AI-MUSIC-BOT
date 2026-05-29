const { getLyricsProvider } = require("../providers/lyrics");

async function generateLyrics(genre, mood) {
  const provider = getLyricsProvider();
  const messages = [
    {
      role: "system",
      content: "You are a professional songwriter.",
    },
    {
      role: "user",
      content: `
Write song lyrics.

Genre: ${genre}
Mood: ${mood}

Structure:
- Verse
- Chorus
- Verse
- Chorus

Keep it emotional and musical.
`,
    },
  ];
  const model = "llama-3.3-70b-versatile";
  return provider.generateLyrics(messages, model);
}

module.exports = generateLyrics;
