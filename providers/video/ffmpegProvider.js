const ffmpeg =
  require("fluent-ffmpeg");

async function renderVideo({

  imagePath,
  audioPath,
  outputPath

}) {

  return new Promise(
    (resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .inputOptions(["-loop 1"]) 
        .input(audioPath)
        .outputOptions([
          "-map 0:v:0", // Ambil video dari input pertama (gambar)
          "-map 1:a:0", // Ambil audio dari input kedua (audio)
          "-c:v libx264",
          "-tune stillimage",
          "-preset superfast",
          "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", // Memastikan dimensi genap agar kompatibel
          "-r 25", // Framerate standar
          "-pix_fmt yuv420p",
          "-c:a aac",
          "-b:a 192k",
          "-ar 44100",
          "-ac 2",
          "-shortest",
          "-movflags +faststart" // Mempercepat loading video di Telegram/Web
        ])
        .on("start", (commandLine) => {
          console.log("🚀 Video Being Rendered...");
        })
        .save(outputPath)
        .on("end", () => {
          console.log(
            "Video rendering finished"
          );

          resolve({
            status: "success",
            videoPath: outputPath
          });

        })

        .on("error", error => {

          reject(error);

        });

    }
  );

}

module.exports = {
  renderVideo
};