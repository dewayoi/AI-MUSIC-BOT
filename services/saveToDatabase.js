const db = require("../database/db");

function saveToDatabase(song) {

  db.run(
    `
    INSERT INTO songs (
      title,
      genre,
      mood,
      lyrics,
      metadata,
      prompt,
      audio_path,
      video_path,
      thumbnail_path,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
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
      "ready",
      song.created_at,
    ],
    (err) => {
      if (err) {
        console.error("❌ Database Insert Error:", err.message);
      }
    }
  );

}

module.exports = saveToDatabase;