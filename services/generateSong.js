const { generateContentPlan } = require("./brain/contentBrain");

const contentPlan = generateContentPlan("youtube_lofi");
const genre = contentPlan.genre;
const mood = contentPlan.mood;

const title = `${mood} ${genre} ${Date.now()}`;

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

async function generateSong() {
    try {

        const title = "Random Title";

  // lyrics generation

  // audio generation

  // video rendering

  // save files

    }  catch (error) {console.log(`Failed generating: ${title}`);console.log(error);
        
    const failedSong = {
    title,
    genre,
    mood,
    status: "failed",
    error: error.message,
    created_at: new Date(),
    };
    }}
    