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
  let attempts = 0;

  do {
    selectedGenre =
      randomItem(strategy.genres);
    attempts++;
  } while (
    isRecentlyUsedGenre(selectedGenre) && 
    attempts < 10 // Prevent infinite loop if all genres are "recent"
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