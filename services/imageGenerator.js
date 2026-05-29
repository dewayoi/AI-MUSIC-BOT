const fs = require("fs");
const axios = require("axios");

async function generateImage(prompt, filename) {
  console.log(`[API] Requesting image from Pollinations AI for: ${filename}...`);
  // Menggunakan Pollinations AI sebagai alternatif gratis tanpa API Key.
  // Kita tambahkan random seed agar gambar selalu unik setiap kali generate.
  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=600&height=600&nologo=true&seed=${seed}`;

  // Download gambar hasil generate
  let response;
  try {
    response = await axios({
      url: imageUrl,
      responseType: "arraybuffer",
      timeout: 120000, // Beri waktu 120 detik
    });
  } catch (error) {
    console.error(`❌ Failed to fetch AI Image: ${error.message}`);
    throw error; // Lempar agar ditangkap oleh try-catch di batchGenerator
  }

  // Buat folder jika belum ada
  const dir = "outputs/images";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = `${dir}/${filename}.png`;
  fs.writeFileSync(filePath, response.data);
  console.log(`[DONE] Image saved to ${filePath}`);
}

module.exports = generateImage;
