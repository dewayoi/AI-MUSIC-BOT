require("dotenv").config();

const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const loadPrompt = require("./services/promptLoader");
const saveOutput = require("./services/saveOutput");
const { generateTitle } = require("./services/titleGenerator");
const { generateContentPlan } = require("./brain/contentBrain");
const generateLyrics = require("./services/lyricsGenerator");
const generateBatch = require("./services/batchGenerator");
const { addToQueue, getQueue } = require("./services/queue");
const db = require("./database/db");

if (!process.env.BOT_TOKEN) {
  console.error("❌ ERROR: BOT_TOKEN tidak ditemukan di file .env!");
  process.exit(1);
}

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: false, // Jangan jalankan polling secara otomatis di konstruktor
});

// Clean up any old webhooks to ensure polling works
bot.deleteWebHook();

// Verifikasi koneksi dan identitas bot
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

// Logging sederhana untuk memastikan pesan sampai ke bot
bot.on("message", (msg) => {
  if (msg.text) {
    console.log(
      `[${new Date().toLocaleString()}] Pesan masuk dari ${msg.from.username || msg.from.id}: ${msg.text}`,
    );
  }
});

bot.onText(/\/start(?:@\S+)?/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Halo! Bot Musik AI sudah aktif.\nGunakan /help untuk melihat daftar perintah.",
  );
});

bot.onText(/\/generate(?:@\S+)?(?:\s+(\S+)\s+(\S+))?/, async (msg, match) => {
  try {
    if (!match[1] || !match[2]) {
      bot.sendMessage(
        msg.chat.id,
        "Format salah. Gunakan: /generate [genre] [mood]\nContoh: /generate reggae happy",
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

bot.onText(
  /\/batch(?:@\S+)?(?:\s+(\S+)\s+(\S+)\s+(\d+))?/,
  async (msg, match) => {
    try {
      if (!match[1] || !match[2] || !match[3]) {
        bot.sendMessage(
          msg.chat.id,
          "Format salah. Gunakan: /batch [genre] [mood] [total]\nContoh: /batch lofi sad 5",
        );
        return;
      }
      const genre = match[1];
      const mood = match[2];
      const total = parseInt(match[3]);

      // ADD TO QUEUE
      addToQueue({
        genre,
        mood,
        total,
      });

      bot.sendMessage(
        msg.chat.id,
        `🚀 Memulai batch generation untuk ${total} lagu...`,
      );

      // Jalankan tanpa 'await' jika ingin bot langsung bisa balas /help,
      // tapi karena kita butuh result, kita tetap pakai await dengan progres di dalamnya.
      const results = await generateBatch(
        genre,
        mood,
        total,
        (progressMessage) => {
          bot.sendMessage(msg.chat.id, progressMessage).catch(() => {});
        },
      );

      bot.sendMessage(
        msg.chat.id,
        "✅ Batch selesai! Gunakan /library untuk melihat hasil.",
      );
    } catch (error) {
      console.error("Batch Error:", error);
      bot.sendMessage(
        msg.chat.id,
        "❌ Terjadi error fatal saat batch generate.",
      );
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
        console.error("Database Error (Library):", err.message);
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
    (err, rows = []) => {
      if (err) {
        console.error("Database Error (Ready):", err.message);
        bot.sendMessage(msg.chat.id, "Gagal mengambil data library.");
        return;
      }

      if (rows.length === 0) {
        return bot.sendMessage(
          msg.chat.id,
          "Tidak ada lagu dengan status 'ready'.",
        );
      }

      let message = "READY TO UPLOAD:\n\n";

      rows.forEach((song) => {
        message += `
${song.id}.
${song.title}

`;
      });

      bot.sendMessage(msg.chat.id, message);
    },
  );
});

bot.onText(/\/genres(?:@\S+)?/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `
Genre tersedia:

- reggae
- lofi
`,
  );
});

bot.onText(/\/help(?:@\S+)?/, (msg) => {
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

bot.on("error", (error) => {
  console.log("General error:", error.message);
});

// Bersihkan webhook terlebih dahulu, baru mulai polling secara manual
bot.deleteWebHook().then(() => {
  console.log("🧹 Webhook lama dibersihkan.");
  bot.startPolling({ restart: true });
  console.log("🚀 Polling dimulai. Bot siap menerima pesan!");
});
