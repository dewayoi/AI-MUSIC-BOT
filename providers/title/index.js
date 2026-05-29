const config = require("../../config");
const groqProvider = require("./groqProvider");

function getTitleProvider() {
  switch (config.TITLE_PROVIDER) {
    case "groq":
      return groqProvider;
    default:
      return groqProvider;
  }
}

module.exports = { getTitleProvider };
