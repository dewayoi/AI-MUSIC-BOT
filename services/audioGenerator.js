const fs = require("fs");
const path = require("path");

async function generateAudio(songData) {
  console.log(
    `Generating audio for ${songData.title}`
  );

  const dir = "outputs/audio";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return {
    audioPath: path.join(dir, `${songData.title}.mp3`),
    status: "generated",
  };
}

module.exports = generateAudio;