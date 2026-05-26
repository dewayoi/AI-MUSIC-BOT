const fs = require("fs");
const path = require("path");
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

    const videoDir = path.dirname(videoPath);
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    await generateVideo(
    imagePath,
    videoPath
    );

    let audioResult;

    if (process.env.USE_DUMMY_AUDIO === "true") {

    audioResult = {

    audioPath: "./assets/dummy.wav",

    status: "dummy",

     };

    } else {

    audioResult = await generateAudio({
      title,
      genre,
      mood,
      lyrics
    });

    }

    const basePrompt = loadPrompt(genre);

    const finalPrompt = `
TITLE:
${title}

${basePrompt}

Mood:
${mood}
`;

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const songFolder = path.join(__dirname, "songs", slug);
if (!fs.existsSync(songFolder)) {
  fs.mkdirSync(songFolder, { recursive: true });
}

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

    const dbPath = path.join(process.cwd(), "songs", "database.json");

    let database = [];

    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (fs.existsSync(dbPath)) {
    const rawData = fs.readFileSync(dbPath);
    database = JSON.parse(rawData);
    }

    database.push(songData);

    fs.writeFileSync(
    dbPath,
    JSON.stringify(database, null, 2)
    );
    fs.writeFileSync(
    path.join(songFolder, "lyrics.txt"),
    lyrics
    );
    fs.writeFileSync(
    path.join(songFolder, "metadata.json"),
    JSON.stringify(songData, null, 2)
    );

    console.log("Song saved to database");

    saveOutput(songData);
    saveToDatabase(songData);

    results.push(songData);

  }

  return results;
}

module.exports = generateBatch;