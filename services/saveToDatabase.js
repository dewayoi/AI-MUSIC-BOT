const dbService = require("./databaseService");

/**
 * Saves a song to the configured database (SQLite or JSON)
 * @param {Object} song - The song data object
 */
async function saveToDatabase(song) {
  try {
    await dbService.saveSong(song);
  } catch (err) {
    console.error("❌ Failed to save song to database:", err.message);
    // We don't throw here to prevent crashing the generation flow, 
    // but the error is logged centrally.
  }
}

module.exports = saveToDatabase;
