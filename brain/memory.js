const fs = require("fs");
const path = require("path");

const dbPath = path.join(
  __dirname,
  "..",
  "songs",
  "database.json"
);

function getHistory() {

  if (!fs.existsSync(dbPath)) {
    return [];
  }

  const rawData =
    fs.readFileSync(dbPath);

  return JSON.parse(rawData);

}
function getRecentSongs(limit = 10) {

  const history = getHistory();

  return history.slice(-limit);

}
function isRecentlyUsedGenre(
  genre,
  limit = 5
) {

  const recentSongs =
    getRecentSongs(limit);

  return recentSongs.some(
    song => song.genre === genre
  );

}
module.exports = {
  getHistory,
  getRecentSongs,
  isRecentlyUsedGenre
};