const words1 = [
  "Golden",
  "Midnight",
  "Broken",
  "Silent",
  "Lonely",
];

const words2 = [
  "Dream",
  "Smoke",
  "Echo",
  "Heartbeat",
  "Sunset",
];

function generateTitle() {
  const first =
    words1[Math.floor(Math.random() * words1.length)];

  const second =
    words2[Math.floor(Math.random() * words2.length)];

  return `${first} ${second}`;
}

module.exports = generateTitle;