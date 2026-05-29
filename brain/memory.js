const fs = require("fs");
const path = require("path");
const db = require("../database/db");
const config = require("../config");

// Default to sqlite if not specified in config
const MEMORY_SOURCE = config.MEMORY_SOURCE || "sqlite"; 

const jsonDbPath = path.join(
  __dirname,
  "..",
  "songs",
  "database.json"
);

/**
 * Gets history from JSON or SQLite based on MEMORY_SOURCE
 * Note: SQLite version returns a Promise
 */
async function getHistory() {
  if (MEMORY_SOURCE === "json") {
    if (!fs.existsSync(jsonDbPath)) {
      return [];
    }
    const rawData = fs.readFileSync(jsonDbPath);
    try {
      return JSON.parse(rawData);
    } catch (e) {
      console.error("Error parsing JSON database:", e.message);
      return [];
    }
  } else {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM songs ORDER BY id ASC", [], (err, rows) => {
        if (err) {
          console.error("Database Error (getHistory):", err.message);
          return resolve([]);
        }
        resolve(rows || []);
      });
    });
  }
}

async function getRecentSongs(limit = 10) {
  if (MEMORY_SOURCE === "json") {
    const history = await getHistory();
    return history.slice(-limit);
  } else {
    return new Promise((resolve) => {
      db.all(
        "SELECT * FROM songs ORDER BY id DESC LIMIT ?",
        [limit],
        (err, rows) => {
          if (err) {
            console.error("Database Error (getRecentSongs):", err.message);
            return resolve([]);
          }
          resolve(rows || []);
        }
      );
    });
  }
}

async function isRecentlyUsedGenre(genre, limit = 5) {
  const recentSongs = await getRecentSongs(limit);
  return recentSongs.some((song) => song.genre === genre);
}

async function isDuplicateTitle(title) {
  if (MEMORY_SOURCE === "json") {
    const history = await getHistory();
    return history.some((song) => {
      if (!song.title) return false;
      return song.title.toLowerCase() === title.toLowerCase();
    });
  } else {
    return new Promise((resolve) => {
      db.get(
        "SELECT id FROM songs WHERE LOWER(title) = LOWER(?) LIMIT 1",
        [title],
        (err, row) => {
          if (err) {
            console.error("Database Error (isDuplicateTitle):", err.message);
            return resolve(false);
          }
          resolve(!!row);
        }
      );
    });
  }
}

module.exports = {
  getHistory,
  getRecentSongs,
  isRecentlyUsedGenre,
  isDuplicateTitle,
};
