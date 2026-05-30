const db = require("../database/db");

function saveToDatabase(song) {
  console.log("Saving song to database:", song.title);
  console.log("Metadata being saved:", song.metadata);

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
      song.status || "ready",
      song.created_at,
    ],
    (err) => {
      if (err) {
        console.error("❌ Database Insert Error:", err.message);
      } else {
        console.log(`✅ Song "${song.title}" saved successfully to database.`);
      }
    }
  );

}

module.exports = saveToDatabase;