const Groq = require("groq-sdk");
const config = require("../../config");
const groq = new Groq({
  apiKey: config.GROQ_API_KEY,
});

module.exports = groq;
