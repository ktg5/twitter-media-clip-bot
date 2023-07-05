const { TwitterApi } = require('twitter-api-v2');
const auth = require(`./auth.json`)
const logger = require('winston');


// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';


// Verify bot.
// V1 Read/Write access
const authClient = new TwitterApi({
    appKey: auth.api_key,
    appSecret: auth.api_key_secret,
    accessToken: auth.access_token,
    accessSecret: auth.access_token_secret,
});

// // App only
// const bearer = new TwitterApi(auth.bearer_key);

// Set settings
const client = authClient.readWrite;

logger.info(`Logged in!`)

module.exports = {client, logger}