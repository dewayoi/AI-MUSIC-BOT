const OpenAI = require("openai");
const config = require("../../config");
const client = new OpenAI({
  apiKey: config.OPENROUTER_API_KEY,

  baseURL: "https://openrouter.ai/api/v1",
});

module.exports = client;
