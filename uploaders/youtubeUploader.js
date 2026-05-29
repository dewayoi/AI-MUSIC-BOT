const fs = require("fs");
const readline = require("readline");

const { google } =
  require("googleapis");

const credentials =
  require("../client_secret.json");

const {
  client_secret,
  client_id,
  redirect_uris
} = credentials.installed;

const oauth2Client =
  new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload"
];

function authorize() {

  const authUrl =
    oauth2Client.generateAuthUrl({

      access_type: "offline",

      scope: SCOPES

    });

  console.log(
    "Authorize this app:"
  );

  console.log(authUrl);

  const rl =
    readline.createInterface({

      input: process.stdin,

      output: process.stdout

    });

  rl.question(
    "Paste code here: ",
    async (code) => {

      rl.close();

      const { tokens } =
        await oauth2Client.getToken(code);

      oauth2Client.setCredentials(tokens);

      fs.writeFileSync(
        "token.json",
        JSON.stringify(tokens)
      );

      console.log(
        "Token saved!"
      );

    }
  );

}

authorize();