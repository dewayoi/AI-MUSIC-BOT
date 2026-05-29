const config = require("../../config");
const groqProvider = require("./groqProvider");

function getMetadataProvider() {
  switch (config.METADATA_PROVIDER) {
    case "groq":
      return groqProvider;
    default:
      return groqProvider;
  }
}

module.exports = { getMetadataProvider };
