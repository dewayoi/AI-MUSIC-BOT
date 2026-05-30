const fs = require("fs");

const { google } =
  require("googleapis");

const {
  authenticate
} = require(
  "@google-cloud/local-auth"
);

async function authorize() {

  const auth =
    await authenticate({

      keyfilePath:
        "./client_secret.json",

      scopes: [
        "https://www.googleapis.com/auth/youtube.upload"
      ]

    });

  fs.writeFileSync(
    "token.json",
    JSON.stringify(
      auth.credentials
    )
  );

  console.log(
    "Token saved!"
  );

}

authorize();