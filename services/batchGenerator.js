const generateSong = require("./generateSong");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fungsi batch untuk mengelola perulangan pembuatan lagu
 */
async function generateBatch(genre, mood, total, onProgress) {
    const generatedSongs = [];

    for (let i = 0; i < total; i++) {
        try {
            if (onProgress) onProgress(`🎵 Memproses lagu ke-${i+1} dari ${total}...`);
            const songData = await generateSong(genre, mood, onProgress);
            generatedSongs.push(songData);
        } catch (error) {
            console.error(`Error generating song ${i + 1} (Genre: ${genre}, Mood: ${mood}):`, error);
             if (onProgress) onProgress(`❌ Gagal generate lagu ke-${i+1}: ${error.message}`);
             
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