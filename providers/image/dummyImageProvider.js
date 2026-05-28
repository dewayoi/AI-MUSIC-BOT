const fs = require("fs");
const path = require("path");

async function generateImage({
  prompt,
  outputPath
}) {

  console.log(
    "Generating thumbnail image..."
  );

  // dummy placeholder file

  fs.writeFileSync(
    outputPath,
    "dummy image"
  );

  return {
    status: "success",
    imagePath: outputPath
  };

}

module.exports = {
  generateImage
};