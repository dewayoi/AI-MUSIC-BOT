const fs = require("fs");
const path = require("path");
const generateLyrics = require("./lyricsGenerator");
const generateMetadata = require("./metadataGenerator");
const { generateTitle } = require("./titleGenerator"); // Added missing import
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
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fungsi internal untuk menghasilkan satu lagu, menggunakan genre dan mood yang diberikan
async function generateSingleSongInternal(
  songIndex,
  totalSongs,
  genre,
  mood,
  contentPlan,
  onProgress,
) {
  const title = generateTitle(genre); // Use generateTitle function

  console.log(`\n--- Song ${songIndex + 1}/${totalSongs} ---`);
  if (onProgress)
    onProgress(`⏳ Processing song ${songIndex + 1}/${totalSongs}: *${title}*`);

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
  const lyrics = (await generateLyrics(genre, mood)) || "No lyrics generated";
  const metadata = (await generateMetadata(title, genre, mood)) || {};
  const visualPrompt =
    (await generateVisualPrompt(genre, mood)) || "abstract background";
  const finalPrompt = buildPrompt({
    title,
    genre,
    mood,
    ...contentPlan,
  });

  // 1.1 SIMPAN LIRIK & METADATA AWAL (Fail-safe)
  // Kita simpan lirik segera setelah digenerate agar tidak hilang jika aset gagal
  fs.writeFileSync(path.join(songFolder, "lyrics.txt"), lyrics || "");
  console.log(`📝 Lyrics saved for: ${title}`);

  const thumbnailPrompt = buildThumbnailPrompt({
    genre,
    mood,
    title,
  });

  const thumbnailPath = path.join(songFolder, "thumbnail.png");

  // FIX: Gunakan AI generator langsung untuk thumbnail agar tidak dummy
  let thumbnailResult = { imagePath: null };
  try {
    // Panggil generateImage AI dan arahkan output langsung ke folder lagu
    await generateImage(thumbnailPrompt, "thumbnail-temp");
    const tempAiPath = path.join(
      process.cwd(),
      "outputs",
      "images",
      "thumbnail-temp.png",
    );
    if (fs.existsSync(tempAiPath)) {
      fs.copyFileSync(tempAiPath, thumbnailPath);
      thumbnailResult.imagePath = thumbnailPath;
    }
  } catch (e) {
    console.warn(
      "AI Thumbnail generation failed, skipping visual asset...",
      e.message,
    );
  }

  // 2. ASSET GENERATION (Image -> Video -> Audio)
  // Gunakan 'slug' untuk filename agar aman dari karakter ilegal di Windows (?, :, |, etc)
  const imagePath = path.join(
    process.cwd(),
    "outputs",
    "images",
    `${slug}.png`,
  );
  const videoPath = path.join(
    process.cwd(),
    "outputs",
    "videos",
    `${slug}.mp4`,
  );

  try {
    // Image
    await generateImage(visualPrompt, slug);

    // Video
    const videoDir = path.dirname(videoPath);
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
    await generateVideo(imagePath, videoPath);
  } catch (e) {
    console.error(`❌ Visual generation failed for ${title}:`, e.message);
    if (onProgress)
      onProgress(`⚠️ Visual/Video failed for *${title}*, continuing...`);
  }

  // Audio
  let audioResult = { audioPath: null, status: "pending" };
  try {
    const audioProvider = getAudioProvider();
    audioResult =
      (await audioProvider.generateAudio({
        title,
        genre,
        mood,
        lyrics,
      })) || audioResult;
  } catch (e) {
    console.error(`❌ Audio generation failed for ${title}:`, e.message);
    if (onProgress) onProgress(`⚠️ Audio failed for *${title}*`);
  }

  // 3. STORAGE ORGANIZATION
  let finalAudioPath = null;
  let finalVideoPath = null;

  try {
    if (videoPath && fs.existsSync(videoPath)) {
      finalVideoPath = path.join(songFolder, "video.mp4");
      fs.copyFileSync(videoPath, finalVideoPath);
    }
  } catch (err) {
    console.error("Video copy failed:", err.message);
  }

  try {
    if (
      audioResult &&
      audioResult.audioPath &&
      fs.existsSync(audioResult.audioPath)
    ) {
      const audioExtension = path.extname(audioResult.audioPath);
      finalAudioPath = path.join(songFolder, `audio${audioExtension}`);
      fs.copyFileSync(audioResult.audioPath, finalAudioPath);
    }
  } catch (err) {
    console.error("Audio copy failed:", err.message);
  }

  // 4. PERSISTENCE (Save to Database & Files)
  const songData = {
    id: Date.now(),
    title,
    genre,
    mood,
    lyrics,
    metadata,
    visualPrompt,
    prompt: finalPrompt,
    audioPath: finalAudioPath,
    audioStatus: audioResult.status,
    videoPath: finalVideoPath,
    thumbnailPrompt,
    thumbnailPath: thumbnailResult.imagePath || thumbnailPath,
    status: "completed",
    created_at: new Date(),
  };

  try {
    fs.writeFileSync(
      path.join(songFolder, "metadata.json"),
      JSON.stringify(songData, null, 2),
    );
    saveOutput(songData);
    saveToDatabase(songData);
    console.log(`Successfully generated and saved: ${title}`);
  } catch (dbErr) {
    console.error("Failed to save song to database/json:", dbErr.message);
    if (onProgress)
      onProgress(`⚠️ Data *${title}* folder created but DB save failed.`);
  }

  if (onProgress) onProgress(`✅ Done: *${title}*`);
  return songData;
}

// Fungsi yang diekspor untuk menghasilkan batch lagu
async function generateBatch(genre, mood, total, onProgress) {
  const contentPlan = await generateContentPlan("youtube_lofi");

  // Gunakan genre/mood dari plan jika tersedia, jika tidak gunakan input manual
  const targetGenre = contentPlan.genre || genre;
  const targetMood = contentPlan.mood || mood;

  const generatedSongs = [];
  // Gunakan parameter 'total' dari user, bukan config
  for (let i = 0; i < total; i++) {
    try {
      const songData = await generateSingleSongInternal(
        i,
        total,
        targetGenre,
        targetMood,
        contentPlan,
        onProgress,
      );
      generatedSongs.push(songData);
    } catch (error) {
      console.error(
        `Error generating song ${i + 1} (Genre: ${genre}, Mood: ${mood}):`,
        error,
      );
      if (onProgress)
        onProgress(`❌ Gagal generate lagu ke-${i + 1}: ${error.message}`);
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
