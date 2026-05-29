const { getAudioProvider } = require("../providers/audio");

async function generateAudio(songData) {
  const provider = getAudioProvider();
  return provider.generateAudio(songData.lyrics, songData.genre);
}

module.exports = generateAudio;
