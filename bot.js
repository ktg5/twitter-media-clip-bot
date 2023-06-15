const {config, client, logger} = require("./botAuth");
const ffmpeg = require('fluent-ffmpeg');
const path = require('node:path');
const fs = require('fs');

// getRandomArbitrary
function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
logger.info(`Starting process...`)
// START
// Time for how long until new clip is uploaded
var time = config.time * 60000;
// Start function
async function startProcess() {
    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
    // Get random epiosde.
    /// Grab all the soggy files from the media directory // LOL THIS WAS FROM THE SOGGY CAT BOT
    const videosPath = path.join(__dirname, 'media');
    const videoFileNames = fs.readdirSync(videosPath);

    var epSelect = getRandomArbitrary(1, videoFileNames.length - 1);
    
    // Get video information.
    ffmpeg.ffprobe(`./media/${epSelect}.${config.videoFormat}`, async function(err, metadata) {
        // Get episode's length.
        var videoLength = metadata.format.duration;
        // Get when the clip will start.
        var clipStart = getRandomArbitrary(0, videoLength - config.clipTime);
        // If you're wondering what the filename is,
        // it's just the time the clip was created
        // in UNIX time.
        var filepath = `clips/${Math.floor(new Date().getTime() / 1000)}.mp4`

        // Now we'll be cooking up a delicious "clip"...
        ffmpeg({source: `./media/${epSelect}.${config.videoFormat}`})
        .setStartTime(clipStart) // When the clip will start.
        .duration(config.clipTime) // How long the clip will go for.
        .on(`start`, function (cmd) { // When render is starting
            logger.info(`Clipping started...`);
        })
        .on(`error`, function (err) { // When ffmpeg came along an error
            logger.error(`Error while making clip!`);
            return logger.error(err);
        })
        .on(`end`, function () {
            logger.info(`Clipping complete! Moving on...`);
            console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
            uploadTweet(filepath);
        })
        // On clip completion, save it to (filepath).
        .saveToFile(filepath)

        async function uploadTweet(filepath) {
            // Moving onto uploading to Twitter...
            logger.info('Upload Started...');

            // Redfine filePath for Twitter api.
            var filePath = `./${filepath}`;

            // Upload media first...
            const mediaId = await client.v1.uploadMedia(filePath);
            logger.info('Upload Completed');

            // Then we can send in the tweet.
            var mainTweet = await client.v2.tweet('', { media: { media_ids: [mediaId] } })
            console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
            logger.info(`Sent main tweet; https://twitter.com/${config.username}/status/${mainTweet.data.id}`);

            // Optional: reply with ep. number and time (in seconds).
            // var replyTweet = await client.v1.reply(`Episode ${epSelect}\n${clipStart} seconds to ${clipStart + config.clipTime} seconds`, mainTweet.id_str);
            // logger.info(`Sent reply tweet; https://twitter.com/${botUsername}/status/${replyTweet.id_str}`);
        }
    });
};

// Start the bot when first loaded.
startProcess();

// After a while, start again.
setInterval(() => {
    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
    logger.info(`Time hit! Redoing process...`)
    startProcess();
}, time);