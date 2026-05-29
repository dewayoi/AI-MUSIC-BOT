module.exports = {
  SONGS_PER_BATCH: 2,

  OUTPUT_DIR: "songs",

  AUDIO_PROVIDER: "huggingFace",

  IMAGE_PROVIDER: "pollinations",

  VIDEO_PROVIDER: "ffmpeg",

  LYRICS_PROVIDER: "groq",

  METADATA_PROVIDER: "groq",

  VISUAL_PROMPT_PROVIDER: "groq",

  GENRES: ["Synthwave", "LoFi", "Phonk", "EDM", "Ambient"],

  MOODS: ["Dark", "Sad", "Dreamy", "Energetic", "Emotional"],

  MEMORY_SOURCE: "sqlite",

  BATCH_DELAY: 3000,
};
