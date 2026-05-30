require("dotenv").config();

const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const loadPrompt = require("./services/promptLoader");
const generateSong = require("./services/generateSong"); //
const { addToQueue, getQueueLength } = require("./services/queue");
const { startQueueWorker } = require("./services/queueWorker");
const db = require("./database/db");

// Fungsi pembantu untuk mencatat Job Batch ke Database
async function createJob(genre, mood, total) {
	return new Promise((resolve, reject) => {
		const now = new Date().toLocaleString("id-ID");
		db.run(
			`INSERT INTO jobs (genre, mood, total_songs, status, created_at) VALUES (?, ?, ?, ?, ?)`,
			[genre, mood, total, "processing", now],
			function (err) {
				if (err) reject(err);
				else resolve(this.lastID);
			},
		);
	});
}

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
bot.getMe().then((me) => {
	console.log(`✅ Berhasil login!`);
	console.log(`🤖 Username: @${me.username}`);
	console.log(`🆔 ID: ${me.id}`);
	console.log(`📢 Menunggu pesan...`);
}).catch((err) => {
	console.error("❌ Gagal terhubung ke Telegram API:", err.message);
});

// Logging sederhana untuk memastikan pesan sampai ke bot
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
		
		bot.sendMessage(msg.chat.id, "🚀 Memulai AI Music Engine...");
		
		const song = await generateSong(genre, mood, (progress) => {
			bot.sendMessage(msg.chat.id, progress).catch(() => {});
		});

		if (song.status === "failed") {
			bot.sendMessage(msg.chat.id, `❌ Gagal: ${song.error}`);
		} else {
			bot.sendMessage(msg.chat.id, `✅ Selesai: *${song.title}*\nFolder: \`songs/${song.title}\``, { parse_mode: "Markdown" });
		}

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
			const jobId = await createJob(genre,mood,total);
			console.log(`📥 [QUEUE] Menambahkan: ${genre} - ${mood} (${total} lagu)`);

			// ADD TO QUEUE
			addToQueue({
				id: jobId,
				genre,
				mood,
				total
			});

			bot.sendMessage(
				msg.chat.id,
				`✅ Job masuk queue.\n\nGenre: ${genre}\nMood: ${mood}\nTotal: ${total}`
			);
		} catch (error) {
			console.error("Batch Error:", error);
			bot.sendMessage(msg.chat.id, "❌ Terjadi error fatal saat batch generate.");
		}
	},
);

bot.onText(/\/queue/, (msg) => {
	bot.sendMessage(msg.chat.id,`Queue saat ini: ${getQueueLength()}`);
});

bot.onText(/\/jobs/, (msg) => {
	db.all(
		`
		SELECT * FROM jobs 
		ORDER BY id DESC 
		LIMIT 10
		`,
		[],
		(err, rows) => {
			if (err) {
				bot.sendMessage(msg.chat.id, "❌ Database error saat mengambil daftar job.");
				console.error("Database Error (Jobs):", err.message);
				return;
			}

			if (!rows || rows.length === 0) {
				bot.sendMessage(msg.chat.id, "📭 Belum ada job di database.");
				return;
			}

			let message = "📝 *10 JOB TERAKHIR:*\n\n";
			rows.forEach((job) => {
				message += `🆔 ID: ${job.id}\n`;
				message += `🎵 ${job.genre} - ${job.mood}\n`;
				message += `📊 Status: ${job.status}\n`;
				message += `📈 Progress: ${job.completed_songs}/${job.total_songs} lagu\n\n`;
			});

			bot.sendMessage(msg.chat.id, message, { parse_mode: "Markdown" });
		},
	);
});

bot.onText(/\/library/, (msg) => {
	db.all(
		`
		SELECT * FROM songs ORDER BY id DESC LIMIT 10
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
				return bot.sendMessage(msg.chat.id, "Tidak ada lagu dengan status 'ready'.");
			}

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

bot.onText(/\/stats/, (msg) => {

    db.all(
      `
      SELECT
      status,
      COUNT(*) total
      FROM songs
      GROUP BY status
      `,
      [],
      (err, rows) => {

        if (err) {

          bot.sendMessage(msg.chat.id,"Database error");

          return;
        }

        let message =
          "📊 SONG STATUS\n\n";

        rows.forEach(row => {

          message +=
            `${row.status}: ${row.total}\n`;

        });

        bot.sendMessage(msg.chat.id,message);

      }
    );

});

bot.onText(/\/failed/, (msg) => {

    db.all(
      `
      SELECT *
      FROM songs
      WHERE status='failed'
      ORDER BY id DESC
      LIMIT 10
      `,
      [],
      (err, rows) => {

        if (!rows.length) {

          bot.sendMessage(msg.chat.id,"Tidak ada failed song");

          return;
        }

        let message =
          "❌ FAILED SONGS\n\n";

        rows.forEach(song => {

          message +=
            `${song.id}
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

bot.onText(/\/help(?:@\S+)?/, (msg) => {
	bot.sendMessage(
		msg.chat.id,
		`
COMMAND:

/generate reggae heartbreak
/generate lofi sad
/genres
/queue
/jobs
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
console.log("🧹 Membersihkan webhook...");
bot.deleteWebHook()
	.catch((err) => console.log("⚠️ Info Webhook:", err.message))
	.finally(() => {
		bot.startPolling({ restart: true });
		startQueueWorker();
		console.log("🚀 Bot & Queue Worker telah aktif!");
	});
