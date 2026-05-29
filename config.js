module.exports = {
  SONGS_PER_BATCH: 2,

  OUTPUT_DIR: "songs",

  AUDIO_PROVIDER: "dummy",

  IMAGE_PROVIDER: "pollinations",

  VIDEO_PROVIDER: "ffmpeg",

  LYRICS_PROVIDER: "groq",

  METADATA_PROVIDER: "groq",

  TITLE_PROVIDER: "groq",

  VISUAL_PROMPT_PROVIDER: "groq",

  GENRES: ["Synthwave", "LoFi", "Phonk", "EDM", "Ambient"],

  MOODS: ["Dark", "Sad", "Dreamy", "Energetic", "Emotional"],

  MEMORY_SOURCE: "sqlite",

  BATCH_DELAY: 3000,

  BOT_TOKEN: process.env.BOT_TOKEN,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  USE_DUMMY_AUDIO: process.env.USE_DUMMY_AUDIO,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
};
