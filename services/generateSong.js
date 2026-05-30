const fs = require("fs");
const path = require("path");
const { generateContentPlan } = require("../brain/contentBrain");
const { isDuplicateTitle } = require("../brain/memory");
const generateTitle = require("./titleGenerator");
const generateLyrics = require("./lyricsGenerator");
const generateMetadata = require("./metadataGenerator");
const generateVisualPrompt = require("./visualPromptGenerator");
const generateImage = require("./imageGenerator");
const { getAudioProvider } = require("../providers/audio");
const { renderVideo } = require("../providers/video/ffmpegProvider");
const { buildPrompt } = require("../prompts/buildPrompt");
const { buildThumbnailPrompt } = require("../thumbnail/buildThumbnailPrompt");
const saveToDatabase = require("./saveToDatabase");
// const { uploadVideo } = require("./youtubeUploader"); // Pastikan file ini ada

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

/**
 * Engine utama untuk generate satu lagu secara utuh
 */
async function generateSong(manualGenre, manualMood, onProgress) {
    const contentPlan = generateContentPlan("youtube_lofi");
    const genre = manualGenre || contentPlan.genre;
    const mood = manualMood || contentPlan.mood;
    
    let title;
    try {
        // 1. UNIQUE TITLE GENERATION
        let attempts = 0;
        const MAX_ATTEMPTS = 10;
        const songsDir = path.join(process.cwd(), "songs");
        if (!fs.existsSync(songsDir)) fs.mkdirSync(songsDir);

        do {
            title = await generateTitle(genre, mood);
            const tempSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            
            // Cek apakah ada folder yang mengandung slug ini (deteksi in-progress)
            const existingFolders = fs.readdirSync(songsDir);
            const isFolderExist = existingFolders.some(folder => folder.endsWith(`_${tempSlug}`));
            
            // Cek database DAN cek keberadaan folder fisik
            const isDuplicate = (await isDuplicateTitle(title)) || isFolderExist;

            if (!isDuplicate) break;

            attempts++;
            await sleep(100);
        } while (attempts < MAX_ATTEMPTS);

        if (attempts >= MAX_ATTEMPTS) {
            console.warn(`⚠️ Judul unik sulit ditemukan untuk ${genre}-${mood}. Menggunakan: ${title}`);
        }

        if (onProgress) onProgress(`⏳ Memulai proses untuk: *${title}*`);

        // 2. PREPARASI FOLDER (Format: YYYYMMDD_NN_title)        
        const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '');

        // Hitung lagu hari ini untuk penomoran
        const todaySongs = fs.readdirSync(songsDir).filter(f => f.startsWith(datePrefix));
        const songNumber = String(todaySongs.length + 1).padStart(2, '0');
        
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const folderName = `${datePrefix}_${songNumber}_${slug}`;
        const songFolder = path.join(songsDir, folderName);
        fs.mkdirSync(songFolder, { recursive: true });

        // 3. ASSET GENERATION
        const lyrics = (await generateLyrics(genre, mood)) || "No lyrics";
        const metadata = (await generateMetadata(title, genre, mood)) || {};
        const visualPrompt = (await generateVisualPrompt(genre, mood)) || "abstract background";
        const finalPrompt = buildPrompt({ title, genre, mood, ...contentPlan });
        const thumbnailPrompt = buildThumbnailPrompt({ genre, mood, title });

        // Simpan lirik & metadata awal
        fs.writeFileSync(path.join(songFolder, "lyrics.txt"), lyrics);

        // Image Generation
        console.log(`🎨 Generating image for: ${title}`);
        const finalImagePath = path.join(songFolder, "image.png");
        await generateImage(visualPrompt, finalImagePath);

        // Thumbnail Generation (AI)
        const thumbnailPath = path.join(songFolder, "thumbnail.png");
        try {
            await generateImage(thumbnailPrompt, thumbnailPath);
        } catch (e) {
            console.warn("AI Thumbnail failed, using main image.");
        }

        // Audio Generation
        const audioProvider = getAudioProvider();
        const audioResult = await audioProvider.generateAudio({ title, genre, mood, lyrics });
        let finalAudioPath = null;
        if (audioResult && audioResult.audioPath && fs.existsSync(audioResult.audioPath)) {
            const ext = path.extname(audioResult.audioPath);
            finalAudioPath = path.join(songFolder, `audio${ext}`);
            fs.copyFileSync(audioResult.audioPath, finalAudioPath);
        }

        // Video Generation
        let finalVideoPath = null;
        if (finalAudioPath && fs.existsSync(finalImagePath)) {
            console.log(`🎬 Rendering video for: ${title}`);
            const videoOut = path.join(songFolder, "video.mp4");
            const videoResult = await renderVideo({
                imagePath: finalImagePath,
                audioPath: finalAudioPath,
                outputPath: videoOut
            });
            if (videoResult) finalVideoPath = videoOut;
        }

        // 4. AUTO UPLOAD (Opsional/Jika video berhasil dibuat)
        let youtubeId = null;
        let currentStatus = finalVideoPath ? "completed" : "pending";

        /* 
        if (finalVideoPath) {
            try {
                if (onProgress) onProgress(`📤 Uploading to YouTube: *${title}*...`);
                const uploadResult = await uploadVideo({
                    title: title,
                    description: metadata, // metadata di sini berisi teks SEO dari AI
                    videoPath: finalVideoPath
                });
                youtubeId = uploadResult.id;
                currentStatus = "uploaded";
            } catch (uErr) {
                console.error("❌ Auto-upload failed:", uErr.message);
            }
        }
        */

        // 5. PERSISTENCE
        const songData = {
            id: Date.now(),
            title, genre, mood, lyrics, metadata,
            prompt: finalPrompt,
            audioPath: finalAudioPath,
            videoPath: finalVideoPath,
            thumbnailPath: thumbnailPath,
            youtubeId: youtubeId,
            status: currentStatus,
            created_at: new Date().toLocaleString("id-ID"),
        };

        // Simpan file metadata di folder (format JSON object agar mudah dibaca manusia)
        fs.writeFileSync(path.join(songFolder, "metadata.json"), JSON.stringify(songData, null, 2));

        // Untuk Database: Metadata harus di-stringify agar tersimpan sebagai TEXT di SQLite
        const dbData = { ...songData };
        if (typeof dbData.metadata === 'object') dbData.metadata = JSON.stringify(dbData.metadata);
        saveToDatabase(dbData);

        console.log(`✅ Successfully generated: ${title}`);
        return songData;

    } catch (error) {
        console.error(`❌ Failed generating ${title || 'unknown'}:`, error.message);
        
        const failedSong = {
            title,
            genre, mood,
            status: "failed",
            error: error.message,
            created_at: new Date().toLocaleString("id-ID"),
        };
        return failedSong;
    }
}

module.exports = generateSong;
    