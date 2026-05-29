const { generateContentPlan } = require("../brain/contentBrain");
const { isDuplicateTitle } = require("../brain/memory");
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

    let title;
    let attempts = 0;
    const MAX_ATTEMPTS = 10; // Batasi percobaan untuk menghindari infinite loop

    do {
      title = generateTitle(genre);
      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        console.warn(
          "Mencapai batas percobaan untuk generate judul unik. Menggunakan judul duplikat.",
        );
        break; // Keluar dari loop jika mencapai batas percobaan
      }
      await sleep(100); // Jeda singkat agar tidak memblokir CPU
    } while (await isDuplicateTitle(title));

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
