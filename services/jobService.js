const db = require("../database/db");

function createJob(
  genre,
  mood,
  total
) {

  return new Promise(
    (resolve, reject) => {

      db.run(
        `
        INSERT INTO jobs
        (
          genre,
          mood,
          total_songs,
          status,
          created_at
        )
        VALUES
        (
          ?,?,?,?,
          datetime('now')
        )
        `,
        [
          genre,
          mood,
          total,
          "queued"
        ],
        function(err) {

          if (err) {
            reject(err);
            return;
          }

          resolve(this.lastID);

        }
      );

    }
  );

}

module.exports = {
  createJob
};