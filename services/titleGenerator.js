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

function generateTitle(genre) {
  const style = titleStyles[genre];

  if (!style) {
    return "Unknown Dreams";
  }

  const adjective = randomItem(style.adjectives);

  const noun = randomItem(style.nouns);

  return `${adjective} ${noun}`;
}

module.exports = {
  generateTitle,
};
