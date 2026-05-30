const {
  uploadVideo
} = require(
  "./uploaders/youtubeUploader"
);

async function test() {
  try {
    const result =
      await uploadVideo({
        title:
          "Test Upload",
        description:
          "Testing upload",
        videoPath:
          "./test.mp4" // Pastikan file test.mp4 benar-benar ada di folder utama
      });
    console.log("Result Data:", result);
  } catch (err) {
    console.log("Test Upload Gagal.");
  }
}

test();