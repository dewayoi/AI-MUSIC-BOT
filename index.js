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
const config = require("./config");

if (!config.BOT_TOKEN) {
  console.error("❌ ERROR: BOT_TOKEN tidak ditemukan di file .env!");
  process.exit(1);
}

const bot = new TelegramBot(config.BOT_TOKEN, {
  polling: false,
});

bot.deleteWebHook();

bot
  .getMe()
  .then((me) => {
    console.log(`✅ Berhasil login!`);
    console.log(`🤖 Username: @${me.username}`);
    console.log(`🆔 ID: ${me.id}`);
    console.log(`📢 Menunggu pesan...`);
  })
  .catch((err) => {
    console.error("❌ Gagal terhubung ke Telegram API:", err.message);
  });

bot.on("message", (msg) => {
  if (msg.text) {
    console.log(
      `[LOG] [${new Date().toLocaleString()}] Pesan masuk dari ${msg.from.username || msg.from.id}: ${msg.text}`,
    );
  }
});

bot.onText(/\/start(?:@\S+)?/, (msg) => {
  console.log(`[CMD] /start triggered by ${msg.from.username || msg.from.id}`);
  bot.sendMessage(
    msg.chat.id,
    "Halo! Bot Musik AI sudah aktif.\nGunakan /help untuk melihat daftar perintah.",
  );
});

bot.onText(/\/generate(?:@\S+)?(?:\s+(\S+)\s+(\S+))?/, async (msg, match) => {
  try {
    if (!match[1] || !match[2]) {
      console.log(
        `[CMD] /generate failed: Invalid format from ${msg.from.username || msg.from.id}`,
      );
      bot.sendMessage(
        msg.chat.id,
        "Format salah. Gunakan: /generate [genre] [mood]\nContoh: /generate reggae happy",
      );
      return;
    }

    const genre = match[1];
    const mood = match[2];
    console.log(
      `[CMD] /generate triggered by ${msg.from.username || msg.from.id} | Genre: ${genre}, Mood: ${mood}`,
    );

    bot.sendMessage(msg.chat.id, "Generating...");

    console.log(`[STEP] Generating Title...:`, { genre, mood });
    const title = await generateTitle(genre, mood);
    console.log(`[STEP] Title: ${title}`);

    console.log(`[STEP] Generating Lyrics...`);
    const lyrics = await generateLyrics(genre, mood);
    console.log(`[STEP] Lyrics generated (Length: ${lyrics.length})`);

    bot.sendMessage(msg.chat.id, "Generating lyrics...");

    console.log(`[STEP] Loading Prompt...`);
    const basePrompt = loadPrompt(genre);

    if (!basePrompt) {
      console.log(`[ERROR] Genre not found: ${genre}`);
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
    console.log(`[STEP] Saving Output...`);
    saveOutput({
      title,
      genre,
      mood,
      lyrics,
      prompt: finalPrompt,
      created_at: new Date(),
    });

    console.log(`[DONE] Song generation complete for: ${title}`);
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
    console.error(`[FATAL] Generate Error:`, error);
    bot.sendMessage(msg.chat.id, "Terjadi error saat generate musik.");
  }
});

bot.onText(
  /\/batch(?:@\S+)?(?:\s+(\S+)\s+(\S+)\s+(\d+))?/,
  async (msg, match) => {
    try {
      if (!match[1] || !match[2] || !match[3]) {
        console.log(
          `[CMD] /batch failed: Invalid format from ${msg.from.username || msg.from.id}`,
        );
        bot.sendMessage(
          msg.chat.id,
          "Format salah. Gunakan: /batch [genre] [mood] [total]\nContoh: /batch lofi sad 5",
        );
        return;
      }
      const genre = match[1];
      const mood = match[2];
      const total = parseInt(match[3]);

      console.log(
        `[CMD] /batch triggered by ${msg.from.username || msg.from.id} | Genre: ${genre}, Mood: ${mood}, Total: ${total}`,
      );

      addToQueue({
        genre,
        mood,
        total,
      });

      bot.sendMessage(
        msg.chat.id,
        `🚀 Memulai batch generation untuk ${total} lagu...`,
      );

      const results = await generateBatch(
        genre,
        mood,
        total,
        (progressMessage) => {
          console.log(`[PROGRESS] ${progressMessage}`);
          bot.sendMessage(msg.chat.id, progressMessage).catch(() => {});
        },
      );

      console.log(
        `[DONE] Batch generation complete for ${results.length} songs`,
      );
      bot.sendMessage(
        msg.chat.id,
        "✅ Batch selesai! Gunakan /library untuk melihat hasil.",
      );
    } catch (error) {
      console.error(`[FATAL] Batch Error:`, error);
      bot.sendMessage(
        msg.chat.id,
        "❌ Terjadi error fatal saat batch generate.",
      );
    }
  },
);

bot.onText(/\/queue/, (msg) => {
  console.log(`[CMD] /queue triggered by ${msg.from.username || msg.from.id}`);
  const queue = getQueue();
  bot.sendMessage(msg.chat.id, `Queue: ${queue.length}`);
});

bot.onText(/\/library/, async (msg) => {
  console.log(
    `[CMD] /library triggered by ${msg.from.username || msg.from.id}`,
  );
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
    console.error(`[ERROR] Library Error:`, err.message);
    bot.sendMessage(msg.chat.id, "❌ Gagal mengambil library.");
  }
});

bot.onText(/\/ready/, async (msg) => {
  console.log(`[CMD] /ready triggered by ${msg.from.username || msg.from.id}`);
  try {
    const rows = await dbService.getSongsByStatus("ready", 10);

    if (rows.length === 0) {
      return bot.sendMessage(
        msg.chat.id,
        "Tidak ada lagu dengan status 'ready'.",
      );
    }

    let message = "READY TO UPLOAD:\n\n";
    rows.forEach((song) => {
      message += `${song.id}. ${song.title}\n`;
    });

    bot.sendMessage(msg.chat.id, message);
  } catch (err) {
    console.error(`[ERROR] Ready Error:`, err.message);
    bot.sendMessage(msg.chat.id, "❌ Gagal mengambil data library.");
  }
});

bot.onText(/\/genres(?:@\S+)?/, (msg) => {
  console.log(`[CMD] /genres triggered by ${msg.from.username || msg.from.id}`);
  bot.sendMessage(
    msg.chat.id,
    `Genre tersedia:

- reggae
- lofi`,
  );
});

bot.onText(/\/help(?:@\S+)?/, (msg) => {
  console.log(`[CMD] /help triggered by ${msg.from.username || msg.from.id}`);
  bot.sendMessage(
    msg.chat.id,
    `COMMAND:

/generate reggae heartbreak
/generate lofi sad
/genres
/help`,
  );
});

bot.on("polling_error", (error) => {
  console.log(`[POLL ERROR] ${error.message}`);
});

bot.on("error", (error) => {
  console.log(`[GEN ERROR] ${error.message}`);
});

bot.deleteWebHook().then(() => {
  console.log("🧹 Webhook lama dibersihkan.");
  bot.startPolling({ restart: true });
  console.log("🚀 Polling dimulai. Bot siap menerima pesan!");
});
