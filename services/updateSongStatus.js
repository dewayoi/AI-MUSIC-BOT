const db = require("../database/db");

function updateSongStatus(
  id,
  status
) {

  return new Promise(
    (resolve, reject) => {

      db.run(
        `
        UPDATE songs
        SET status=?
        WHERE id=?
        `,
        [status, id],
        (err) => {

          if (err) {
            reject(err);
            return;
          }

          resolve();

        }
      );

    }
  );

}

module.exports =
  updateSongStatus;