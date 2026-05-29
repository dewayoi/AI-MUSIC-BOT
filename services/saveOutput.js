const fs = require("fs");
const path = require("path");

function saveOutput(data) {
  const dir = path.join(process.cwd(), "outputs", "json");
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filename = path.join(dir, `${Date.now()}.json`);
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  
  return filename;
}

module.exports = saveOutput;
