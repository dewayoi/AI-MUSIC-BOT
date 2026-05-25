const fs = require("fs");

function loadPrompt(name) {
  try {
    return fs.readFileSync(`prompts/${name}.txt`, "utf8");
  } catch (error) {
    return null;
  }
}

module.exports = loadPrompt;