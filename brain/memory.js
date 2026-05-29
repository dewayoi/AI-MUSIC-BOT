const dbService = require("../services/databaseService");

async function getHistory() {
  return dbService.getAllSongs(1000); // Fetch a reasonable amount for "history"
}

async function getRecentSongs(limit = 10) {
  return dbService.getRecentSongs(limit);
}

async function isRecentlyUsedGenre(genre, limit = 5) {
  const recentSongs = await getRecentSongs(limit);
  return recentSongs.some((song) => song.genre === genre);
}

async function isDuplicateTitle(title) {
  const song = await dbService.findSongByTitle(title);
  return !!song;
}

module.exports = {
  getHistory,
  getRecentSongs,
  isRecentlyUsedGenre,
  isDuplicateTitle,
};
