const dbService = require("./databaseService");

/**
 * Saves a song to the configured database (SQLite or JSON)
 * @param {Object} song - The song data object
 */
async function saveToDatabase(song) {
  console.log(`[STEP] Saving song "${song.title}" to database...`);
  try {
    await dbService.saveSong(song);
    console.log(`[DONE] Song saved to database successfully.`);
  } catch (err) {
    console.error(`[ERROR] Failed to save song to database:`, err.message);
  }
}

module.exports = saveToDatabase;
