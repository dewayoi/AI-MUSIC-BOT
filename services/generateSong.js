const genres = config.GENRES[
  "Synthwave",
  "LoFi",
  "Phonk",
  "EDM",
  "Ambient"
];

const moods = config.MOODS[
  "Sad",
  "Happy",
  "Energetic",
  "Aggressive",
  "Dark",
  "Energetic",
  "Dreamy",
  "Emotional"
];

const genre =
  genres[Math.floor(Math.random() * genres.length)];

const mood =
  moods[Math.floor(Math.random() * moods.length)];

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
    