const generateTitle = require("./titleGenerator");
const generateLyrics = require("./lyricsGenerator");
const saveOutput = require("./saveOutput");
const loadPrompt = require("./promptLoader");
const saveToDatabase = require("./saveToDatabase");
const generateMetadata = require("./metadataGenerator");
const generateVisualPrompt = require("./visualPromptGenerator");
const generateImage = require("./imageGenerator");

async function generateBatch(
  genre,
  mood,
  total
) {

  const results = [];

  for (let i = 0; i < total; i++) {

    const title = generateTitle();

    const lyrics = await generateLyrics(
      genre,
      mood
    );
    const metadata = await generateMetadata(
    title,
    genre,
    mood
    );
    const visualPrompt = await generateVisualPrompt(
    genre,
    mood
    );
    await generateImage(
    visualPrompt,
    title
    );

    const basePrompt = loadPrompt(genre);

    const finalPrompt = `
TITLE:
${title}

${basePrompt}

Mood:
${mood}
`;

    const songData = {
      title,
      genre,
      mood,
      lyrics,
      metadata,
      visualPrompt,
      prompt: finalPrompt,
      created_at: new Date(),
    };

    saveOutput(songData);
    saveToDatabase(songData);

    results.push(songData);

  }

  return results;
}

module.exports = generateBatch;