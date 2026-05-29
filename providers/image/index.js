const config = require("../../config");
const dummyImageProvider = require("./dummyImageProvider");
const pollinationsProvider = require("./pollinationsProvider");

function getImageProvider() {
  switch (config.IMAGE_PROVIDER) {
    case "pollinations":
      return pollinationsProvider;
    case "dummy":
      return dummyImageProvider;
    default:
      return pollinationsProvider;
  }
}

module.exports = { getImageProvider };
