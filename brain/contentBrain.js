const strategies = require("./strategies");
const {isRecentlyUsedGenre} = require("./memory");

function randomItem(array) {
  return array[
    Math.floor(Math.random() * array.length)
  ];
}

function generateContentPlan(strategyName) {

  const strategy =
    strategies[strategyName];

  let selectedGenre;

  do {
    selectedGenre =
      randomItem(strategy.genres);
  } while (
    isRecentlyUsedGenre(selectedGenre)
  );

  return {
    genre: selectedGenre,
    mood:
      randomItem(strategy.moods),

    structureType:
      strategy.structure,

    hookType:
      strategy.hook

  };

}

module.exports = {
  generateContentPlan
};