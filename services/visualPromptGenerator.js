const groq = require("./groq");

async function generateVisualPrompt(
  genre,
  mood
) {

  const response =
    await groq.chat.completions.create({

      model: "llama-3.3-70b-versatile",

      messages: [

        {
          role: "system",
          content:
            "You are an expert AI art prompt creator.",
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

      ],

    });

  return response.choices[0].message.content;

}

module.exports = generateVisualPrompt;