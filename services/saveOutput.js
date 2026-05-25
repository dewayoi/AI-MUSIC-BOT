const fs = require("fs");

function saveOutput(data) {
  const filename = `outputs/json/${Date.now()}.json`;

  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

module.exports = saveOutput;