const generateTitle = require("./titleGenerator");
const generateLyrics = require("./lyricsGenerator");
const saveOutput = require("./saveOutput");
const loadPrompt = require("./promptLoader");
const saveToDatabase = require("./saveToDatabase");
const generateMetadata = require("./metadataGenerator");
const generateVisualPrompt = require("./visualPromptGenerator");
const generateImage = require("./imageGenerator");
const generateAudio = require("./audioGenerator");
const generateVideo = require("./videoGenerator");

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

    const imagePath =
    `outputs/images/${title}.png`;

    const videoPath =
    `outputs/videos/${title}.mp4`;

    await generateVideo(
    imagePath,
    videoPath
    );

    let audioResult;

    if (process.env.USE_DUMMY_AUDIO === "true") {

    audioResult = {

    audioPath: "./assets/dummy.mp3",

    status: "dummy",

     };

    } else {

    audioResult =
    await generateMusic(
      genre,
      mood,
      lyrics
    );

    }

    const basePrompt = loadPrompt(genre);

    const finalPrompt = `
TITLE:
${title}

${basePrompt}

Mood:
${mood}
`;

    const songData = {
    id: Date.now(),

    title,
    genre,
    mood,
    lyrics,
    metadata,
    visualPrompt,
    prompt: finalPrompt,

    audioPath: audioResult.audioPath,
    audioStatus: audioResult.status,

    videoPath,

    status: "completed",

    created_at: new Date(),
    };

    saveOutput(songData);
    saveToDatabase(songData);

    results.push(songData);

  }

  return results;
}

module.exports = generateBatch;