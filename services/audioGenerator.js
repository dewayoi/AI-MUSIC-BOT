const fs = require("fs");
const path = require("path");

async function generateAudio(songData) {
  console.log(`[STEP] Generating (DUMMY) audio for: ${songData.title}...`);

  const dir = "outputs/audio";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const audioPath = path.join(dir, `${songData.title}.mp3`);
  
  if (!fs.existsSync(audioPath)) {
    fs.writeFileSync(audioPath, Buffer.alloc(0)); 
  }

  console.log(`[DONE] Dummy audio file created at: ${audioPath}`);
  return {
    audioPath: audioPath,
    status: "generated",
  };
}

module.exports = generateAudio;
