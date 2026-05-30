const fs = require("fs");
const { google } = require("googleapis");

const credentials =
  require("../client_secret.json");

const token =
  require("../token.json");

const {
  client_secret,
  client_id,
  redirect_uris
} = credentials.installed || credentials.web; // Mendukung tipe 'installed' atau 'web'

const oauth2Client =
  new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

oauth2Client.setCredentials(token);

const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client
});

async function uploadVideo({
  title,
  description,
  videoPath
}) {
  try {
    // Pastikan file video ada sebelum diupload
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file tidak ditemukan di path: ${videoPath}`);
    }

    const response =
      await youtube.videos.insert({
        part: "snippet,status", // Menggunakan string koma untuk part
        requestBody: {
          snippet: {
            title,
            description
          },
          status: {
            privacyStatus: "private"
          }
        },
        media: {
          body: fs.createReadStream(videoPath)
        }
      });

    console.log("✅ Upload berhasil!");
    return response.data;
  } catch (error) {
    console.error("❌ Error saat upload ke YouTube:");
    // Menampilkan detail error dari Google API jika ada
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

module.exports = {
  uploadVideo
};