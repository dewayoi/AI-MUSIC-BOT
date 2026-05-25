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
      status,
      created_at
    )

    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      song.title,
      song.genre,
      song.mood,
      song.lyrics,
      song.metadata,
      song.prompt,
      "ready",
      song.created_at,
    ]
  );

}

module.exports = saveToDatabase;