const { exec } = require("child_process");

function generateVideo(imagePath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`[SHELL] Running FFmpeg to render video from ${imagePath}...`);
    const command = `ffmpeg -y -loop 1 -r 25 -i "${imagePath}" -i "${audioPath}" -vf "scale='trunc(iw/2)*2:trunc(ih/2)*2',format=yuv420p" -c:v libx264 -c:a aac -b:a 192k -ar 44100 -ac 2 -preset superfast -tune stillimage -shortest "${outputPath}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        if (error.message.includes("not recognized")) {
          reject(
            new Error(
              "FFmpeg is not installed or not in your system PATH. Please install FFmpeg to enable video generation.",
            ),
          );
        } else {
          reject(new Error(`FFmpeg Error: ${stderr || error.message}`));
        }
      } else {
        console.log(`[DONE] Video rendered: ${outputPath}`);
        resolve(outputPath);
      }
    });
  });
}

module.exports = { generateVideo };
