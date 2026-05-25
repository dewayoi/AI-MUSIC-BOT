const { exec } = require("child_process");

function generateVideo(
  imagePath,
  outputPath
) {

  return new Promise((resolve, reject) => {

    const command = `
ffmpeg
-loop 1
-i "${imagePath}"
-c:v libx264
-t 30
-pix_fmt yuv420p
"${outputPath}"
`;

    exec(command, (error) => {

      if (error) {
        reject(error);
      } else {
        resolve(outputPath);
      }

    });

  });

}

module.exports = generateVideo;