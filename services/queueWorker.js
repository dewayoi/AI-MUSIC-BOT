const { getQueue } = require("./queue");
const generateSong = require("./generateSong");

let isRunning = false;

async function startQueueWorker() {

  if (isRunning) {
    return;
  }

  isRunning = true;

  console.log("🚀 Queue Worker Started");

  while (true) {

    const queue = getQueue();

    if (queue.length > 0) {

      const job = queue.shift();

      console.log(
        `🎵 Processing ${job.genre} ${job.mood}`
      );

      try {

        for (
          let i = 0;
          i < job.total;
          i++
        ) {

          await generateSong(
            job.genre,
            job.mood
          );

        }

      } catch (error) {

        console.error(
          "Queue Error:",
          error.message
        );

      }

    }

    await new Promise(resolve =>
      setTimeout(resolve, 5000)
    );

  }

}

module.exports = {
  startQueueWorker
};