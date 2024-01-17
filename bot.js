const {client, logger} = require("./botAuth");
const ffmpeg = require('fluent-ffmpeg');
const path = require('node:path');
const fs = require('fs-extra');
const editJsonFile = require('edit-json-file');
const schedule = require('node-schedule');
const config = require('./config.json');

// getRandomArbitrary
function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// get local db
const db = editJsonFile(`${__dirname}/db.json`, {
    autosave: true
});

console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
logger.info(`Starting process when it hits a new hour...`)

// Start function
async function startProcess() {
    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
    // Get random media.
    const videosPath = path.join(__dirname, 'media');
    const mediaFiles = fs.readdirSync(videosPath)

    var selectedMedia = getRandomMedia(mediaFiles);
    // Actual function so that we can call it back if it's the same as before
    function getRandomMedia(mediaFiles) {
        var selectedIndex = getRandomArbitrary(1, mediaFiles.length - 1);
        var result = mediaFiles[selectedIndex];
        // Make sure this one isn't the same as before
        if (db.get('lastMedia')) {
            if (db.get('lastMedia') !== result) {
                // complete -- not a copy
                db.set('lastMedia', result)
                return result;
            } else {
                // do it again
                getRandomMedia(mediaFiles);
            }
        }
    }
    var mediaPath = `./media/${selectedMedia}`;
        
    // Get video information.
    ffmpeg.ffprobe(mediaPath, async function(err, metadata) {
        // Get media's length.
        var videoLength = metadata.format.duration;
        // Get when the clip will start.
        var clipStart = getRandomArbitrary(0, videoLength - config.clipTime);
        // If you're wondering what the filename is,
        // it's just the time the clip was created
        // in UNIX time.
        var filepath = `./clips/${Math.floor(new Date().getTime() / 1000)}.mp4`

        // Now we'll be cooking up a delicious "clip"...
        ffmpeg({source: mediaPath})
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

            // Now we're gonna try to upload the media & tweets.
            try {
                // Upload media first...
                var mediaId = await client.v1.uploadMedia(filePath);
                logger.info('Upload Completed');

                // Then we can send in the tweet.
                var mainTweet = await client.v2.tweet('', { media: { media_ids: [mediaId] } })
                console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
                logger.info(`Sent main tweet; https://twitter.com/${config.username}/status/${mainTweet.data.id}`);

                // Oh! Don't forget the reply!
                // Get time
                var minutes = Math.floor(clipStart / 60);
                var seconds = clipStart - minutes * 60;
                // If seconds is less than 10, add a "0" at the start.
                if (seconds < 10) seconds = "0" + seconds;

                // Let's also get that extension text out of the media name for this second post.
                var fileExtension = path.extname(mediaPath);
                var fileName = path.basename(mediaPath, fileExtension);

                var replyTweet = await client.v2.reply(`Video: "${fileName}"\nStarts at ${minutes}:${seconds}`, mainTweet.data.id );
                logger.info(`Sent reply tweet; https://twitter.com/${config.username}/status/${replyTweet.data.id}`);
            
            } catch (err) {
                logger.error(`Something happened while uploading / trying to tweet!!`);
                logger.error(err);
            }
        }
    });
};

// After it hits an hour, start again.
var j = schedule.scheduleJob('0 */1 * * *', function(){  // this for one hour
    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
    logger.info(`Time hit! Redoing process...`)
    startProcess();
});