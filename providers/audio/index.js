const config = require("../../config");

const dummyProvider = require("./dummyProvider");
const huggingFaceProvider = require("./huggingfaceProvider");

function getAudioProvider() {
  switch (config.AUDIO_PROVIDER) {
    case "dummy":
      return dummyProvider;
    case "huggingFace":
      return huggingFaceProvider;
    default:
      return dummyProvider;
  }
}

module.exports = {
  getAudioProvider,
};
