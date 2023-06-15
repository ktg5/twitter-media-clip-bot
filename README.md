# oocnichijou-bot
The Twitter bot used for "oocnichijou".

While this bot was bulit for just Nichijou, it could also be used for other shows too--not just Nichijou.

## Requirements!!!
* [npm & Node.JS](https://nodejs.org/en) (It's what the bot runs on, duh)
* [ffmpeg](https://ffmpeg.org/download.html) (For encoding/making clips)
* Legally obtained video files of Nichijou (Could be other anime too).
  * Note: There can be **ANY** amount of videos in the `media` folder
* [Access to the Twitter API (aka having a Twitter Application](https://developer.twitter.com) (Free or not)
* A brain or two. (Just read the instructions below, one by one)

## How to work.
1. Clone the repo - `git clone https://github.com/ktg5/oocnichijou-bot`
2. Legally optain a copy of Nichijou in file format and place all episodes into the `media` folder, then delete the `_EPISODES GO HERE` file as it isn't needed.
* Note: There can be **ANY** amount of videos in the `media` folder, as the bot reads all files inside the folder.
  * BUT: This also means any file that isn't a video file inside the `media` folder will also be read by the bot, so **DON'T ADD ANYTHING INTO THE `media` FOLDER THAT ISN'T A VIDEO!!!**
3. Install required packages. - `npm i`
4. Open `auth.json` and replace all the listed keys (api & access) with your own, also make sure to set the Twitter username and video file format in `config.json`.
* ⚠⚠ Remember to **make sure your access keys are "`Created with Read, and Write permissions`" by enabling "`User authentication`" in your Twitter app's page!**
5. Start the bot. - `npm start`

If any errors occur, please report them to the issues page! Thank you!