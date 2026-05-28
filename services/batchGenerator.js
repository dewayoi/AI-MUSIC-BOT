const fs = require("fs");
const path = require("path");
const generateLyrics = require("./lyricsGenerator");
const generateMetadata = require("./metadataGenerator");
const generateTitle = require("./titleGenerator"); // Added missing import
const generateVisualPrompt = require("./visualPromptGenerator");
const { buildThumbnailPrompt } = require("../thumbnail/buildThumbnailPrompt");
const { buildPrompt } = require("../prompts/buildPrompt");
const generateImage = require("./imageGenerator");
const generateVideo = require("./videoGenerator");
const { getAudioProvider } = require("../providers/audio");
const { getImageProvider } = require("../providers/image");
const saveOutput = require("./saveOutput");
const saveToDatabase = require("./saveToDatabase");
const config = require("../config"); // Added missing import
const { generateContentPlan } = require("../brain/contentBrain");


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fungsi internal untuk menghasilkan satu lagu, menggunakan genre dan mood yang diberikan
async function generateSingleSongInternal(songIndex, totalSongs, genre, mood, contentPlan, onProgress) {
    const title = generateTitle(); // Use generateTitle function

    console.log(`\n--- Song ${songIndex + 1}/${totalSongs} ---`);
    if (onProgress) onProgress(`⏳ Processing song ${songIndex + 1}/${totalSongs}: *${title}*`);

    // 0. PREPARASI FOLDER
    // Slug harus bersih agar tidak ENOENT saat mkdir
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const songFolder = path.join(process.cwd(), "songs", slug);
    if (!fs.existsSync(songFolder)) {
      fs.mkdirSync(songFolder, { recursive: true });
    }

    // 1. DATA GENERATION
    const lyrics = await generateLyrics(genre, mood);
    const metadata = await generateMetadata(title, genre, mood);
    const visualPrompt = await generateVisualPrompt(genre, mood);
    const imageProvider = getImageProvider();
    const finalPrompt = buildPrompt({
      title,
      genre,
      mood,
      ...contentPlan
    });

    const thumbnailPrompt =buildThumbnailPrompt({
      genre,
      mood,
      title
    });

    const thumbnailPath = path.join(songFolder,"thumbnail.png");
    
    // Gunakan provider secara aman
    let thumbnailResult = { imagePath: null };
    try {
        const imageProvider = getImageProvider();
        thumbnailResult = await imageProvider.generateImage({
            prompt: thumbnailPrompt,
            outputPath: thumbnailPath
        }) || thumbnailResult;
    } catch (e) {
        console.warn("Thumbnail generation failed, skipping...");
    }

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
      thumbnailPrompt,
      thumbnailPath: thumbnailResult.imagePath,
      status: "completed",
      created_at: new Date(),
    };

    // Simpan file teks di folder lagu secara aman
    fs.writeFileSync(path.join(songFolder, "lyrics.txt"), lyrics || "");
    fs.writeFileSync(path.join(songFolder, "metadata.json"), JSON.stringify(songData, null, 2));

    saveOutput(songData);
    saveToDatabase(songData);

      console.log(`Successfully generated: ${title}`);
    if (onProgress) onProgress(`✅ Done: *${title}*`)
    return songData;
  }

    // Fungsi yang diekspor untuk menghasilkan batch lagu
    async function generateBatch(genre, mood, total, onProgress) {
    const contentPlan = generateContentPlan("youtube_lofi");

    // Gunakan genre/mood dari plan jika tersedia, jika tidak gunakan input manual
    const targetGenre = contentPlan.genre || genre;
    const targetMood = contentPlan.mood || mood;

    const generatedSongs = [];
      // Gunakan parameter 'total' dari user, bukan config
    for (let i = 0; i < total; i++) {
        try {
            const songData = await generateSingleSongInternal(i, total, targetGenre, targetMood, contentPlan, onProgress);
            generatedSongs.push(songData);
        } catch (error) {
            console.error(`Error generating song ${i + 1} (Genre: ${genre}, Mood: ${mood}):`, error);
             if (onProgress) onProgress(`❌ Gagal generate lagu ke-${i+1}: ${error.message}`);
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