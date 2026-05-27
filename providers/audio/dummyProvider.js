const path = require("path");

async function generateAudio({
  title,
  genre,
  mood,
  lyrics
}) {

  console.log("Generating audio with Dummy Provider");

   if (process.env.USE_DUMMY_AUDIO === "true") {
    return {
      audioPath: path.join(process.cwd(), "assets", "dummy.wav"),
      status: "dummy_asset",
    };
  } else {
    return {
      status: "success",
      audioPath: "./temp/audio.mp3"
    };
  }

}

module.exports = {
  generateAudio
};