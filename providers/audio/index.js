const config = require("../../config");

const dummyProvider = require("./dummyProvider");

function getAudioProvider() {

  switch (config.AUDIO_PROVIDER) {

    case "dummy":
      return dummyProvider;

    default:
      return dummyProvider;

  }

}

module.exports = {
  getAudioProvider
};