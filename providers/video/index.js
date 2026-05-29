const config = require("../../config");
const ffmpegProvider = require("./ffmpegProvider");

function getVideoProvider() {
  switch (config.VIDEO_PROVIDER) {
    case "ffmpeg":
      return ffmpegProvider;
    default:
      return ffmpegProvider;
  }
}

module.exports = { getVideoProvider };
