const groq = require("./groq");

async function generateLyrics(genre, mood) {
  console.log(`[API] Requesting lyrics from Groq...`);
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

  console.log(`[API] Lyrics received.`);
  return response.choices[0].message.content;
}

module.exports = generateLyrics;
