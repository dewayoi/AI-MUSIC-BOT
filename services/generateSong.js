const { generateContentPlan } = require("../brain/contentBrain");
const { generateTitle } = require("./titleGenerator");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fungsi utama untuk menghasilkan satu lagu
async function generateSong() {
  try {
    const contentPlan = await generateContentPlan("youtube_lofi");
    const genre = contentPlan.genre;
    const mood = contentPlan.mood;

    const title = await generateTitle(genre, mood);

    // lyrics generation

    // audio generation

    // video rendering

    // save files
  } catch (error) {
    console.log(`Failed generating: ${title}`);
    console.log(error);

    const failedSong = {
      title,
      genre,
      mood,
      status: "failed",
      error: error.message,
      created_at: new Date(),
    };
  }
}

module.exports = generateSong; // Pastikan fungsi ini diekspor jika ingin digunakan
