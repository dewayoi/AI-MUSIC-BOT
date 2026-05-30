const db = require("../database/db");

function isDuplicateTitle(title) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT id
      FROM songs
      WHERE LOWER(title)=LOWER(?)
      LIMIT 1
      `,
      [title],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(!!row);
      }
    );
  });
}

function getRecentSongs(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT *
      FROM songs
      ORDER BY id DESC
      LIMIT ?
      `,
      [limit],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows);
      }
    );
  });
}

async function isRecentlyUsedGenre(
  genre,
  limit = 5
) {
  const songs =
    await getRecentSongs(limit);

  return songs.some(
    song => song.genre === genre
  );
}

module.exports = {
  isDuplicateTitle,
  getRecentSongs,
  isRecentlyUsedGenre
};