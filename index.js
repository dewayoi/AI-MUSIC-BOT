require("dotenv").config();

const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const loadPrompt = require("./services/promptLoader");
const saveOutput = require("./services/saveOutput");
const generateTitle = require("./services/titleGenerator");
const generateLyrics = require("./services/lyricsGenerator");
const generateBatch = require("./services/batchGenerator");
const { addToQueue, getQueue } = require("./services/queue");
const db = require("./database/db");
const config = require("./config");

const bot = new TelegramBot(process.env.BOT_TOKEN, {
	polling: true,
});

bot.onText(/\/generate (.+) (.+)/, async (msg, match) => {
	try {
		const genre = match[1];
		const mood = match[2];
		bot.sendMessage(msg.chat.id, "Generating...");
		const title = generateTitle();
		const lyrics = await generateLyrics(genre, mood);
		bot.sendMessage(msg.chat.id, "Generating lyrics...");
		const basePrompt = loadPrompt(genre);

		if (!basePrompt) {
			bot.sendMessage(msg.chat.id, "Genre tidak ditemukan.");
			return;
		}

		const finalPrompt = `
	TITLE:
${title}

${basePrompt}

MOOD:
${mood}
`;
		saveOutput({
			title,
			genre,
			mood,
			lyrics,
			prompt: finalPrompt,
			created_at: new Date(),
		});

		bot.sendMessage(
			msg.chat.id,
			`
TITLE:
${title}

LYRICS:
${lyrics}

PROMPT:
${finalPrompt}
`,
		);
	} catch (error) {
		console.log(error);

		bot.sendMessage(msg.chat.id, "Terjadi error.");
	}
});

bot.onText(/\/batch (.+) (.+) (.+)/, async (msg, match) => {
		try {
			const genre = match[1];
			const mood = match[2];
			const total = parseInt(match[3]);

			// ADD TO QUEUE
			addToQueue({
				genre,
				mood,
				total,
			});

			bot.sendMessage(msg.chat.id, `Generating ${total} songs...`);

			const results = await generateBatch(genre, mood, total);

			let message = "BATCH RESULT:\n\n";

			results.forEach((song, index) => {
				message += `
${index + 1}.
${song.title}

`;
			});

			bot.sendMessage(msg.chat.id, message);
		} catch (error) {
			console.log(error);

			bot.sendMessage(msg.chat.id, "Batch error.");
		}
	},
);
bot.onText(/\/queue/, (msg) => {
	const queue = getQueue();

	bot.sendMessage(msg.chat.id, `Queue: ${queue.length}`);
});

bot.onText(/\/library/, (msg) => {
	db.all(
		`
		SELECT * FROM songs
		ORDER BY id DESC
		LIMIT 10
		`,
		[],
		(err, rows) => {
			if (err) {
				bot.sendMessage(msg.chat.id, "Database error.");

				return;
			}

			let message = "LAST SONGS:\n\n";

			rows.forEach((song) => {
				message += `
${song.id}.
${song.title}
(${song.genre})

`;
			});

			bot.sendMessage(msg.chat.id, message);
		},
	);
});

bot.onText(/\/ready/, (msg) => {

  db.all(
    `
    SELECT * FROM songs
    WHERE status='ready'
    ORDER BY id DESC
    LIMIT 10
    `,
    [],
    (err, rows) => {

      let message =
        "READY TO UPLOAD:\n\n";

      rows.forEach((song) => {

        message += `
${song.id}.
${song.title}

`;

      });

      bot.sendMessage(
        msg.chat.id,
        message
      );

    }
  );

});

bot.onText(/\/genres/, (msg) => {
	bot.sendMessage(
		msg.chat.id,
		`
Genre tersedia:

- reggae
- lofi
`,
	);
});

bot.onText(/\/help/, (msg) => {
	bot.sendMessage(
		msg.chat.id,
		`
COMMAND:

/generate reggae heartbreak
/generate lofi sad
/genres
/help
`,
	);
});

bot.on("polling_error", (error) => {
	console.log("Polling error:", error.message);
});

console.log("Bot aktif dab...");
