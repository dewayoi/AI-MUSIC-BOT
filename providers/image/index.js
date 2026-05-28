const config = require("../../config");

const dummyImageProvider =
  require("./dummyImageProvider");

function getImageProvider() {

  switch (
    config.IMAGE_PROVIDER
  ) {

    case "dummy":
      return dummyImageProvider;

    default:
      return dummyImageProvider;

  }

}

module.exports = {
  getImageProvider
};