const groq = require("./groq");

async function generateLyrics(genre, mood) {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",

    messages: [
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
    ],
  });

  return response.choices[0].message.content;
}

module.exports = generateLyrics;