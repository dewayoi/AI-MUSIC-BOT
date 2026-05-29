const config = require("../../config");
const groqProvider = require("./groqProvider");

function getVisualPromptProvider() {
  switch (config.VISUAL_PROMPT_PROVIDER) {
    case "groq":
      return groqProvider;
    default:
      return groqProvider;
  }
}

module.exports = { getVisualPromptProvider };
