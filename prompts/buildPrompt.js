const genrePrompts = require("./genres");
const moodPrompts = require("./moods");
const hooks = require("./hooks");
const structures = require("./structure");
const audiences = require("./audiences");
const platforms = require("./platforms");

function buildPrompt({
  title,
  genre,
  mood,
  hookType,
  structureType,
  audience,
  platform
}) {

  const genreStyle =
    genrePrompts[genre] || "";

  const moodStyle =
    moodPrompts[mood] || "";

  const hookPrompt =
    hooks[hookType] || "";

  const structurePrompt =
    structures[structureType] || "";

  const audiencePrompt =
    audiences[audience] || "";

  const platformPrompt =
    platforms[platform] || "";

  return `

Song Title:
${title}

Music Style:
${genreStyle}

Mood:
${moodStyle}

Hook Strategy:
${hookPrompt}

Song Structure:
${structurePrompt}

Target Audience:
${audiencePrompt}

Platform Optimization:
${platformPrompt}

Create a professional high quality music track
with strong emotional atmosphere and cinematic production.

`;

}

module.exports = {
  buildPrompt
};