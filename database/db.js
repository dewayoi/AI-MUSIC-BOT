const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(
  "./database/music.db"
);

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      genre TEXT,
      mood TEXT,
      lyrics TEXT,
      prompt TEXT,
      metadata TEXT,
      audio_path TEXT,
      image_path TEXT,
      video_path TEXT,
      thumbnail_path TEXT,
      Status TEXT,
      created_at TEXT
    )
  `);

	db.run(`
		CREATE TABLE IF NOT EXISTS jobs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			genre TEXT,
			mood TEXT,
			total_songs INTEGER,
			completed_songs INTEGER DEFAULT 0,
			status TEXT,
			created_at TEXT
		)
	`);

});

module.exports = db;