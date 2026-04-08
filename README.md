# twitter-media-clip-bot
A Twitter bot used for making clips out of randomly selected media.

## v2 is out!!
Since X/Twitter has been a**-f**king everyone with a free API tier in change of the "pay-per-use" tiers, in protest, this project is now using [emusks](https://emusks.tiago.zip/)! Go show 'em some love.

The bot has also transferred to Typescript, 'cause it's cool & I've been trying to use that instead. You'll also need to install [bun](https://bun.sh/), which serves as a Node + npm replacement & also handles the Typescript stuff.

## Requirements!!!
* [Bun](https://bun.sh/) (It's what the bot runs on, duh)
* [ffmpeg](https://ffmpeg.org/download.html) (For encoding/making clips)
* A collection of media for the bot to use
* A brain or two (Just read the instructions below, one by one)

## How to work.
1. Clone the repo - `git clone https://github.com/ktg5/twitter-mediatoclip-bot`
2. Place the media you'd like the bot to use into the `media` folder, then delete the `_EPISODES GO HERE`, file as it isn't needed.
* Note: There can be **ANY** amount of videos in the `media` folder, as the bot reads all files inside the folder and selects a random one to be cliped.
  * BUT: This also means any file that isn't a video will also be read by the bot, so **DON'T ADD ANYTHING INTO THE `media` FOLDER THAT ISN'T A VIDEO!!!**
3. Install required packages. - `bun i`
4. Open `auth.json` and replace the `auth_token` by [following the instructions here](https://emusks.tiago.zip/getting-started/authentication.html#finding-your-auth-token). You will be getting the token cookie for your Twitter account, so when it says to log in, do so with your Twitter account's normal log in information.
5. Start the bot. - `bun start`

If any errors occur, please report them to the issues page! Thank you!
