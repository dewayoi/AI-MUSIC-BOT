const { isDuplicateTitle } = require("../brain/memory");

const titleStyles = {
  LoFi: {
    adjectives: ["Midnight", "Dreamy", "Rainy", "Silent", "Blue", "Lonely"],

    nouns: ["Coffee", "Dreams", "Tokyo", "Rain", "Memories", "Night"],
  },

  Phonk: {
    adjectives: ["Dark", "Broken", "Savage", "Ghost", "Bloody", "Shadow"],

    nouns: ["Drift", "Signal", "Street", "Chaos", "Night", "Bass"],
  },

  Ambient: {
    adjectives: ["Floating", "Eternal", "Silent", "Celestial", "Fading"],

    nouns: ["Horizons", "Skies", "Echoes", "Light", "Dreams"],
  },
};

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function _generateTitle(genre) {
  const style = titleStyles[genre];

  if (!style) {
    return "Unknown Dreams";
  }

  const adjective = randomItem(style.adjectives);

  const noun = randomItem(style.nouns);

  return `${adjective} ${noun}`;
}

async function generateTitle(genre) {
  let attempts = 0;
  const MAX_ATTEMPTS = 10;
  do {
    title = _generateTitle(genre);
    attempts++;
    if (attempts >= MAX_ATTEMPTS) {
      console.warn(
        "Mencapai batas percobaan untuk generate judul unik. Menggunakan judul duplikat.",
      );
      break; // Keluar dari loop jika mencapai batas percobaan
    }
    await sleep(100); // Jeda singkat agar tidak memblokir CPU
  } while (await isDuplicateTitle(title));
  return title;
}

module.exports = {
  generateTitle,
};
