const { getVideoProvider } = require("../providers/video");

async function generateVideo(imagePath, audioPath, outputPath) {
  const provider = getVideoProvider();
  return provider.generateVideo(imagePath, audioPath, outputPath);
}

// Export as an object to match the main batch processor's expectations
module.exports = { generateVideo };
