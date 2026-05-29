const { getImageProvider } = require("../providers/image");

async function generateImage(prompt, filename) {
  const provider = getImageProvider();
  return provider.generateImage(prompt, filename);
}

module.exports = generateImage;
