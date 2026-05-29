const groq = require("./groq");

const words1 = [
  "Golden",
  "Midnight",
  "Broken",
  "Silent",
  "Lonely",
];

const words2 = [
  "Dream",
  "Smoke",
  "Echo",
  "Heartbeat",
  "Sunset",
];

async function generateTitle(genre, mood) {
  try {
    console.log(`🤖 Requesting AI Title for: ${genre} - ${mood}...`);
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a creative song title generator. Output ONLY the title text, no quotes, no extra words, max 3-4 words.",
        },
        {
          role: "user",
          content: `Create a unique song title for genre: ${genre || 'any'}, mood: ${mood || 'any'}.`,
        },
      ],
    });

    const title = response.choices[0].message.content.trim().replace(/"/g, '');
    console.log(`✨ AI Generated Title: ${title}`);
    return title || "Untitled Echo";
  } catch (error) {
    console.error("❌ AI Title Generator Error:", error.message, "| Using fallback arrays.");
    
    const first =
      words1[Math.floor(Math.random() * words1.length)];

    const second =
      words2[Math.floor(Math.random() * words2.length)];

    return `${first} ${second}`;
  }
}

module.exports = generateTitle;