const fs = require("fs");
const path = require("path");
const generateLyrics = require("./lyricsGenerator");
const generateMetadata = require("./metadataGenerator");
const generateTitle = require("./titleGenerator"); // Added missing import
const generateVisualPrompt = require("./visualPromptGenerator");
const { buildPrompt } = require("../prompts/buildPrompt");
const generateImage = require("./imageGenerator");
const generateVideo = require("./videoGenerator");
const { getAudioProvider } = require("../providers/audio");
const saveOutput = require("./saveOutput");
const saveToDatabase = require("./saveToDatabase");
const config = require("../config"); // Added missing import
const { generateContentPlan } = require("../brain/contentBrain");


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fungsi internal untuk menghasilkan satu lagu, menggunakan genre dan mood yang diberikan
async function generateSingleSongInternal(songIndex, totalSongs, genre, mood, contentPlan) {
    const title = generateTitle(); // Use generateTitle function

    console.log(`\n--- Song ${songIndex + 1}/${totalSongs} ---`);

    // 1. DATA GENERATION
    const lyrics = await generateLyrics(genre, mood);
    const metadata = await generateMetadata(title, genre, mood);
    const visualPrompt = await generateVisualPrompt(genre, mood);
    const finalPrompt = buildPrompt({
      title,
      genre,
      mood,
      ...contentPlan
    });

    // 2. ASSET GENERATION (Image -> Video -> Audio)
    // Image
    await generateImage(visualPrompt, title);
    const imagePath = path.join(process.cwd(), "outputs", "images", `${title}.png`);

    // Video
    const videoPath = path.join(process.cwd(), "outputs", "videos", `${title}.mp4`);
    const videoDir = path.dirname(videoPath);
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
    await generateVideo(imagePath, videoPath);

    // Audio
    const audioProvider = getAudioProvider();
    const audioResult = await audioProvider.generateAudio({
      title,
      genre,
      mood,
      lyrics,
    });

    // 3. STORAGE ORGANIZATION
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const songFolder = path.join(process.cwd(), "songs", slug);
    if (!fs.existsSync(songFolder)) {
      fs.mkdirSync(songFolder, { recursive: true });
    }

    const audioExtension = path.extname(audioResult.audioPath);
    const finalAudioPath = path.join(songFolder, `audio${audioExtension}`);
    const finalVideoPath = path.join(songFolder, "video.mp4");

    // Salin file ke folder tujuan (Fix bug destDir & ENOENT)
    if (fs.existsSync(videoPath)) {
      fs.copyFileSync(videoPath, finalVideoPath);
    }
    fs.copyFileSync(audioResult.audioPath, finalAudioPath);

    // 4. PERSISTENCE (Save to Database & Files)
    const songData = {
      id: Date.now(),
      title, genre, mood, lyrics, metadata, visualPrompt,
      prompt: finalPrompt,
      audioPath: finalAudioPath,
      audioStatus: audioResult.status,
      videoPath: finalVideoPath,
      status: "completed",
      created_at: new Date(),
    };

    // Simpan ke database JSON utama
    const dbPath = path.join(process.cwd(), "songs", "database.json");
    let database = [];
    if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    if (fs.existsSync(dbPath)) {
      database = JSON.parse(fs.readFileSync(dbPath));
    }
    database.push(songData);
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
    
    // Simpan file teks di folder lagu
    fs.writeFileSync(path.join(songFolder, "lyrics.txt"), lyrics);
    fs.writeFileSync(path.join(songFolder, "metadata.json"), JSON.stringify(songData, null, 2));

    saveOutput(songData);
    saveToDatabase(songData);

      console.log(`Successfully generated and organized: ${title}`);
    return songData;
  }

    // Fungsi yang diekspor untuk menghasilkan batch lagu
    async function generateBatch(genre, mood, total) {
    const contentPlan = generateContentPlan("youtube_lofi");

    // Gunakan genre/mood dari plan jika tersedia, jika tidak gunakan input manual
    const targetGenre = contentPlan.genre || genre;
    const targetMood = contentPlan.mood || mood;

    const generatedSongs = [];
    for (let i = 0; i < config.SONGS_PER_BATCH; i++) {
        try {
            const songData = await generateSingleSongInternal(i, total, targetGenre, targetMood, contentPlan);
            generatedSongs.push(songData);
        } catch (error) {
            console.error(`Error generating song ${i + 1} (Genre: ${genre}, Mood: ${mood}):`, error);
            // Menambahkan objek lagu gagal agar panjang array hasil konsisten
            generatedSongs.push({
                title: `Failed Song ${i + 1}`,
                genre,
                mood,
                status: "failed",
                error: error.message,
                created_at: new Date(),
            });
        }
        await sleep(3000);
    }
    return generatedSongs;
}

module.exports = generateBatch;