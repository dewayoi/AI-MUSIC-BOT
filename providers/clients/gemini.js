const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../../config");
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

module.exports = genAI;
