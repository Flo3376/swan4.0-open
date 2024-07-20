// openai.js

const { OpenAI, Configuration } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.apiKey,
});

//const openai = new OpenAIApi(configuration);

module.exports = {
    openai,
};