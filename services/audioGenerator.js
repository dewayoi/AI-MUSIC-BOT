const fs = require("fs");
const path = require("path");

async function generateAudio(songData) {
  console.log(
    `Generating audio for ${songData.title}`
  );

  const dir = "outputs/audio";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const audioPath = path.join(dir, `${songData.title}.mp3`);
  
  // BUAT FILE DUMMY: Tanpa ini, batchGenerator tidak akan menemukan file untuk di-copy
  if (!fs.existsSync(audioPath)) {
    fs.writeFileSync(audioPath, Buffer.alloc(0)); 
  }

  return {
    audioPath: audioPath,
    status: "generated",
  };
}

module.exports = generateAudio;