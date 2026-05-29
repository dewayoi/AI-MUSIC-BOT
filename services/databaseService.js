const fs = require("fs");
const path = require("path");
const db = require("../database/db");
const config = require("../config");

const DB_TYPE = config.DATABASE_TYPE || config.MEMORY_SOURCE || "sqlite";
const JSON_DB_PATH = path.join(process.cwd(), "songs", "database.json");

class DatabaseService {
  constructor() {
    this.type = DB_TYPE;
    console.log(`📦 Database Service initialized using: ${this.type}`);
  }

  async saveSong(songData) {
    if (this.type === "json") {
      return this._saveToJson(songData);
    } else {
      return this._saveToSqlite(songData);
    }
  }

  async getAllSongs(limit = 10, offset = 0) {
    if (this.type === "json") {
      const history = await this._readJson();
      return history.reverse().slice(offset, offset + limit);
    } else {
      return new Promise((resolve, reject) => {
        db.all(
          "SELECT * FROM songs ORDER BY id DESC LIMIT ? OFFSET ?",
          [limit, offset],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });
    }
  }

  async getSongsByStatus(status, limit = 10) {
    if (this.type === "json") {
      const history = await this._readJson();
      return history
        .filter(s => s.status === status)
        .reverse()
        .slice(0, limit);
    } else {
      return new Promise((resolve, reject) => {
        db.all(
          "SELECT * FROM songs WHERE status = ? ORDER BY id DESC LIMIT ?",
          [status, limit],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });
    }
  }

  async findSongByTitle(title) {
    if (this.type === "json") {
      const history = await this._readJson();
      return history.find(s => s.title && s.title.toLowerCase() === title.toLowerCase());
    } else {
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM songs WHERE LOWER(title) = LOWER(?) LIMIT 1",
          [title],
          (err, row) => {
            if (err) return reject(err);
            resolve(row);
          }
        );
      });
    }
  }

  async getRecentSongs(limit = 10) {
    return this.getAllSongs(limit);
  }

  // --- Private Helpers ---

  async _readJson() {
    if (!fs.existsSync(JSON_DB_PATH)) return [];
    try {
      const data = fs.readFileSync(JSON_DB_PATH, "utf8");
      return JSON.parse(data) || [];
    } catch (e) {
      console.error("❌ Error reading JSON DB:", e.message);
      return [];
    }
  }

  async _saveToJson(songData) {
    try {
      const history = await this._readJson();
      history.push(songData);
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(history, null, 2));
      return true;
    } catch (e) {
      console.error("❌ Failed to save to JSON:", e.message);
      throw e;
    }
  }

  async _saveToSqlite(song) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO songs (
          title, genre, mood, lyrics, metadata, prompt, 
          audio_path, video_path, thumbnail_path, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          song.title,
          song.genre,
          song.mood,
          song.lyrics,
          typeof song.metadata === 'object' ? JSON.stringify(song.metadata) : song.metadata,
          song.prompt,
          song.audioPath,
          song.videoPath,
          song.thumbnailPath,
          song.status || "ready",
          song.created_at instanceof Date ? song.created_at.toISOString() : song.created_at,
        ],
        function(err) {
          if (err) {
            console.error("❌ SQLite Insert Error:", err.message);
            return reject(err);
          }
          resolve({ id: this.lastID });
        }
      );
    });
  }
}

module.exports = new DatabaseService();
