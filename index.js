require("dotenv").config();

const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const loadPrompt = require("./services/promptLoader");
const saveOutput = require("./services/saveOutput");
const { generateTitle } = require("./services/titleGenerator");
const generateLyrics = require("./services/lyricsGenerator");
const generateBatch = require("./services/batchGenerator");
const { addToQueue, getQueue } = require("./services/queue");
const dbService = require("./services/databaseService");

if (!process.env.BOT_TOKEN) {
	console.error("❌ ERROR: BOT_TOKEN tidak ditemukan di file .env!");
	process.exit(1);
}

const bot = new TelegramBot(process.env.BOT_TOKEN, {
	polling: false,
});

bot.deleteWebHook();

bot.getMe().then((me) => {
	console.log(`✅ Berhasil login!`);
	console.log(`🤖 Username: @${me.username}`);
	console.log(`🆔 ID: ${me.id}`);
	console.log(`📢 Menunggu pesan...`);
}).catch((err) => {
	console.error("❌ Gagal terhubung ke Telegram API:", err.message);
});

bot.on("message", (msg) => {
	if (msg.text) {
		console.log(`[${new Date().toLocaleString()}] Pesan masuk dari ${msg.from.username || msg.from.id}: ${msg.text}`);
	}
});

bot.onText(/\/start(?:@\S+)?/, (msg) => {
	bot.sendMessage(
		msg.chat.id,
		"Halo! Bot Musik AI sudah aktif.\nGunakan /help untuk melihat daftar perintah."
	);
});

bot.onText(/\/generate(?:@\S+)?(?:\s+(\S+)\s+(\S+))?/, async (msg, match) => {
	try {
		if (!match[1] || !match[2]) {
			bot.sendMessage(
				msg.chat.id,
				"Format salah. Gunakan: /generate [genre] [mood]\nContoh: /generate reggae happy"
			);
			return;
		}

		const genre = match[1];
		const mood = match[2];
		bot.sendMessage(msg.chat.id, "Generating...");
		const title = generateTitle(genre);
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
		bot.sendMessage(msg.chat.id, "Terjadi error saat generate musik.");
	}
});

bot.onText(/\/batch(?:@\S+)?(?:\s+(\S+)\s+(\S+)\s+(\d+))?/, async (msg, match) => {
		try {
			if (!match[1] || !match[2] || !match[3]) {
				bot.sendMessage(
					msg.chat.id,
					"Format salah. Gunakan: /batch [genre] [mood] [total]\nContoh: /batch lofi sad 5"
				);
				return;
			}
			const genre = match[1];
			const mood = match[2];
			const total = parseInt(match[3]);

			addToQueue({
				genre,
				mood,
				total,
			});

			bot.sendMessage(msg.chat.id, `🚀 Memulai batch generation untuk ${total} lagu...`);

			const results = await generateBatch(genre, mood, total, (progressMessage) => {
				bot.sendMessage(msg.chat.id, progressMessage).catch(() => {});
			});

			bot.sendMessage(msg.chat.id, "✅ Batch selesai! Gunakan /library untuk melihat hasil.");
		} catch (error) {
			console.error("Batch Error:", error);
			bot.sendMessage(msg.chat.id, "❌ Terjadi error fatal saat batch generate.");
		}
	},
);

bot.onText(/\/queue/, (msg) => {
	const queue = getQueue();
	bot.sendMessage(msg.chat.id, `Queue: ${queue.length}`);
});

bot.onText(/\/library/, async (msg) => {
  try {
    const rows = await dbService.getAllSongs(10);
    let message = "LAST SONGS:\n\n";

    if (rows.length === 0) {
      message += "Library is empty.";
    } else {
      rows.forEach((song) => {
        message += `${song.id}. ${song.title} (${song.genre})\n`;
      });
    }

    bot.sendMessage(msg.chat.id, message);
  } catch (err) {
    console.error("Library Error:", err.message);
    bot.sendMessage(msg.chat.id, "❌ Gagal mengambil library.");
  }
});

bot.onText(/\/ready/, async (msg) => {
  try {
    const rows = await dbService.getSongsByStatus("ready", 10);
    
    if (rows.length === 0) {
      return bot.sendMessage(msg.chat.id, "Tidak ada lagu dengan status 'ready'.");
    }

    let message = "READY TO UPLOAD:\n\n";
    rows.forEach((song) => {
      message += `${song.id}. ${song.title}\n`;
    });

    bot.sendMessage(msg.chat.id, message);
  } catch (err) {
    console.error("Ready Error:", err.message);
    bot.sendMessage(msg.chat.id, "❌ Gagal mengambil data library.");
  }
});

bot.onText(/\/genres(?:@\S+)?/, (msg) => {
	bot.sendMessage(
		msg.chat.id,
		`Genre tersedia:

- reggae
- lofi`
	);
});

bot.onText(/\/help(?:@\S+)?/, (msg) => {
	bot.sendMessage(
		msg.chat.id,
		`COMMAND:

/generate reggae heartbreak
/generate lofi sad
/genres
/help`
	);
});

bot.on("polling_error", (error) => {
	console.log("Polling error:", error.message);
});

bot.on("error", (error) => {
	console.log("General error:", error.message);
});

bot.deleteWebHook().then(() => {
	console.log("🧹 Webhook lama dibersihkan.");
	bot.startPolling({ restart: true });
	console.log("🚀 Polling dimulai. Bot siap menerima pesan!");
});
