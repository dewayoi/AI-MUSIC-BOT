const groq = require("./groq");

async function generateMetadata(
  title,
  genre,
  mood
) {
  console.log(`[API] Requesting metadata from Groq for: ${title}...`);
  const response =
    await groq.chat.completions.create({

      model: "llama-3.3-70b-versatile",

      messages: [

        {
          role: "system",
          content:
            "You are a YouTube music SEO expert.",
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

      ],

    });

  console.log(`[API] Metadata received.`);
  return response.choices[0].message.content;

}

module.exports = generateMetadata;
