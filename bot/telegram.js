const TelegramBot = require("node-telegram-bot-api");

function createBot(token) {
  return new TelegramBot(token, {
    polling: true,
  });
}

module.exports = createBot;