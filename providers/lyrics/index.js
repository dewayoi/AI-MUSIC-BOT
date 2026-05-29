const config = require("../../config");
const groqProvider = require("./groqProvider");

function getLyricsProvider() {
  switch (config.LYRICS_PROVIDER) {
    case "groq":
      return groqProvider;
    default:
      return groqProvider;
  }
}

module.exports = { getLyricsProvider };
