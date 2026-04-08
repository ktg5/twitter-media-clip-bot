import Emusks from 'emusks';
import auth from "./auth.json" with { type: "json" };
import Logger from 'winston';


// Configure logger settings
Logger.remove(Logger.transports.Console);
Logger.add(Logger.transports.Console, {
    colorize: true
});
Logger.level = 'debug';
export var logger = Logger;


// Make Twitter bot
export const client = new Emusks();
await client.login(auth.auth_token);


// Logged in message
const me = await client.account.viewer();
logger.info(`Logged into Twitter as @${me.username}!`);
