const { Client } = require("@gradio/client");

/**
 * Generates a song using the live Hugging Face Tencent/SongGeneration Space
 * @param {string} lyric - The structured lyrics text for the song
 * @returns {Promise<Array>} The resulting data array containing the generated audio file URLs
 */
async function generateSong(lyric, genre) {
  console.log(`[API] Requesting song generation from Hugging Face...`);

  // Connect directly to the live Hugging Face cloud Space
  const client = await Client.connect("tencent/SongGeneration");

  const response = await client.predict("/generate_song", {
    lyric: lyric,
    description: null,
    genre: genre,
    cfg_coef: 1.8,
    temperature: 0.8,
  });

  console.log(`[API] Song generation completed.`);
  return response.data;
}

module.exports = { generateSong };
