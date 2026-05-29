const fs = require("fs");
const axios = require("axios");
const path = require("path");

async function generateImage(prompt, filename) {
  console.log(`[API] Requesting image from Pollinations AI for: ${filename}...`);
  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=600&height=600&nologo=true&seed=${seed}`;

  let response;
  try {
    response = await axios({
      url: imageUrl,
      responseType: "arraybuffer",
      timeout: 120000,
    });
  } catch (error) {
    console.error(`❌ Failed to fetch AI Image: ${error.message}`);
    throw error;
  }

  const dir = "outputs/images";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `${filename}.png`);
  fs.writeFileSync(filePath, response.data);
  console.log(`[DONE] Image saved to ${filePath}`);
  
  return {
    status: "success",
    imagePath: filePath
  };
}

module.exports = { generateImage };
