async function generateAudio(songData) {

  console.log(
    `Generating audio for ${songData.title}`
  );

  return {
    audioPath: `outputs/audio/${songData.title}.mp3`,
    status: "generated",
  };

}

module.exports = generateAudio;