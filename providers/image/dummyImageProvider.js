const fs = require("fs");

async function generateImage({
  prompt,
  outputPath
}) {

  console.log(
    "Generating AI thumbnail..."
  );

  const encodedPrompt =
    encodeURIComponent(prompt);

  const imageUrl =
    `https://image.pollinations.ai/prompt/${encodedPrompt}`;

  const response =
    await fetch(imageUrl);

  const arrayBuffer =
    await response.arrayBuffer();

  const buffer =
    Buffer.from(arrayBuffer);

  fs.writeFileSync(
    outputPath,
    buffer
  );

  return {

    status: "success",

    imagePath: outputPath

  };

}

module.exports = {
  generateImage
};