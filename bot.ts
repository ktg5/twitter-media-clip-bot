import { client, logger } from "./botAuth.js";
import ffmpeg from 'fluent-ffmpeg';
import path from 'node:path';
import fs from 'fs';
import editJsonFile from 'edit-json-file';
import schedule from 'node-schedule';
import config from './config.json' with { type: "json" };

var restartCount = 0;


// getRandomArbitrary
function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}


// get local db
const db = editJsonFile(`${__dirname}/db.json`, {
    autosave: true
});


type FFmpegData = {
    source: string,
    startTime: number,
    output: string
}
var ffmpegData: FFmpegData;


// Make sure the media folder exists
const mediaFolder = fs.existsSync('media/');
if (mediaFolder === false) {
    logger.info('Creating "media" folder...');
    fs.mkdirSync('media');
    logger.info('Created "media" folder!');
}


console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
if (config.minutes !== 0) logger.warn('"config.minutes" set! Using minutes instead of hours');
logger.info(`Starting process when it hits every ${config.minutes ? `${config.minutes} minute(s)...` : `${config.hours} hour(s)...`}`);

// Start function
async function startProcess(defiendClip?: string, ffmpegRender?: FFmpegData) {
    let renderedClip;
    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
    
    if (!defiendClip) {
        // Get random media.
        const videosPath = path.join(__dirname, 'media');
        const mediaFiles = fs.readdirSync(videosPath)

        let selectedMedia = getRandomMedia(mediaFiles);
        // Actual function so that we can call it back if it's the same as before
        function getRandomMedia(mediaFiles: string[]) {
            let selectedIndex = getRandomArbitrary(1, mediaFiles.length - 1);
            let result = mediaFiles[selectedIndex];
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
        let mediaPath = `./media/${selectedMedia}`;
            
        // Get video information.
        ffmpeg.ffprobe(mediaPath, async function(err, metadata) {
            // Get media's length.
            let videoLength = metadata.format.duration;
            if (!videoLength) throw new Error(`Could not get video duration for "${mediaPath}"`);

            // Get when the clip will start.
            let clipStart = getRandomArbitrary(0, videoLength - config.clipTime);
            // If you're wondering what the filename is,
            // it's just the time the clip was created
            // in UNIX time.
            let filepath = `./clips/${Math.floor(new Date().getTime() / 1000)}.mp4`

            // FFmpeg data we'll use
            ffmpegData = {
                source: mediaPath,
                startTime: clipStart,
                output: filepath
            }
            if (ffmpegRender) ffmpegData = ffmpegRender;

            // Now we'll be cooking up a delicious "clip"...
            ffmpeg({source: ffmpegData.source})
                .setStartTime(ffmpegData.startTime) // When the clip will start.
                .duration(config.clipTime) // How long the clip will go for.
                .saveToFile(ffmpegData.output) // On clip completion, save it to (filepath).
                .on(`start`, function (cmd) { // When render is starting
                    logger.info(`Clipping Started...`);
                })
                .on(`error`, function (err) { // When ffmpeg came along an error
                    console.error(err);
                    logger.error(`Error while making clip!`);
                    if (restartCount >= 5) {
                        console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
                        logger.error(`Too many restarts! Not going to continue.`);
                        return restartCount = 0;
                    } else {
                        logger.error(`Restarting Render...`);
                        startProcess(undefined, ffmpegData);
                        restartCount++;
                    }
                    return;
                })
                .on(`end`, function () {
                    logger.info(`Clipping complete! Moving on...`);
                    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
                    renderedClip = filepath;
                    uploadTweet(filepath);
                });

            async function uploadTweet(filepath: string) {
                // Moving onto uploading to Twitter...
                logger.info('Upload Started...');

                // Redfine filePath for Twitter api.
                let filePath = `./${filepath}`;

                // Now we're gonna try to upload the media & tweets.
                try {
                    // Upload media first...
                    let media = await client.media.create(filePath);
                    logger.info('Upload Completed');

                    // Get time.
                    let minutes = Math.floor(ffmpegData.startTime / 60);
                    let seconds = ffmpegData.startTime - minutes * 60;
                    let secondsTxt = String(seconds);
                    // If seconds is less than 10, add a "0" at the start.
                    if (seconds < 10) secondsTxt = "0" + secondsTxt;

                    // Let's also get that extension text out of the media name for this second post.
                    var fileExtension = path.extname(mediaPath);
                    var fileName = path.basename(mediaPath, fileExtension);


                    // Add alt text.
                    let altTxt = config.message;
                    altTxt = altTxt.replaceAll("{$__fileName__}", fileName);
                    altTxt = altTxt.replaceAll("{$__minutes__}", String(minutes));
                    altTxt = altTxt.replaceAll("{$__seconds__}", secondsTxt);

                    // Then we can send in the tweet.
                    const mainTweet = await client.tweets.create(config.addReplyInsteadofAlt === false ? altTxt : '', {
                        mediaIds: [media.media_id_string],
                    });
                    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
                    const me = await client.account.viewer();
                    logger.info(`Sent main tweet; https://twitter.com/${me.username}/status/${mainTweet.data.id}`);

                    // Oh! Don't forget the reply!
                    let replyTweet = undefined;
                    if (config.addReplyInsteadofAlt && config.addReplyInsteadofAlt == true) {
                        replyTweet = await client.tweets.create(altTxt, {
                            replyTo: mainTweet.id
                        });
                        logger.info(`Sent reply tweet; https://twitter.com/${me.username}/status/${replyTweet.data.id}`);
                    }
                
                } catch (error: any) {
                    logger.error(`Tweet failed! "${error.message}"`);
                    console.error(error);
                    if (restartCount >= 5) {
                        logger.error(`Too many restarts! Not going to continue.`);
                        return restartCount = 0;
                    } else {
                        logger.error(`Restarting...`);
                        startProcess(filePath);
                        restartCount++;
                    }
                    return;
                }
            }
        });
    }
};


// This is here for testing reasons if you want to run the bot immediately as it's started
// startProcess();

// Get time and convert it for use for the schedule
let nodeSchedule = `0 */${config.hours} * * *`;
if (config.minutes !== 0) nodeSchedule = `*/${config.minutes} * * * *`;
var j = schedule.scheduleJob(nodeSchedule, () => {  // this for one hour
    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
    logger.info(`Time hit! Redoing process...`)
    startProcess();
});
