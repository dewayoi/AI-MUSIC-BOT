const { getVideoProvider } = require("../providers/video");

async function generateVideo(imagePath, outputPath) {
  const provider = getVideoProvider();
  return provider.generateVideo(imagePath, outputPath);
}

module.exports = generateVideo;
