/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:26:13
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-05 13:33:01
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

global.dep = require('./dep.js');

const reload = dep.reload(require);
const EventEmitter = require('eventemitter3');
global.Promise = require('bluebird');
const botEmitter = new EventEmitter();
const Spawner = require('./structures/Spawner');

var irc = require('./irc.js');
botEmitter.on('reloadConfig', () => {
    reloadConfig();
});
botEmitter.on('saveConfig', () => {
    saveConfig();
});
botEmitter.on('reloadDiscord', () => {
    discord.bot.disconnect(false);
    reload.emptyCache(discord.requireCtx);
    discord = reload('./discord.js');
    discord.init(VERSION, config, botEmitter);
});
botEmitter.on('reloadIrc', () => {
    irc.bot.disconnect('Reloading!');
    reload.emptyCache(irc.requireCtx);
    irc = reload('./irc.js');
    irc.init(VERSION, config, botEmitter);
});




/** CONFIG STUFF **/
if (dep.fs.existsSync(dep.path.join(__dirname, 'config.json'))) {
    var configFile = dep.fs.readFileSync(dep.path.join(__dirname, 'config.json'), 'utf8');
    global.config = JSON.parse(configFile);
} else {
    global.config = {};
    saveConfig();
}
global.bu = require('./util.js');
bu.init();

/** LOGGING STUFF **/

console.log = function (...args) {
    logger.debug(...args);
};


var VERSION = config.version;

function reloadConfig() {
    logger.info('Attempting to reload config');
    dep.fs.readFile(dep.path.join(__dirname, 'config.json'), 'utf8', function (err, data) {
        if (err) throw err;
        config = JSON.parse(data);
    });
}

function saveConfig() {
    dep.fs.writeFile(dep.path.join(__dirname, 'config.json'), JSON.stringify(config, null, 4));
}
global.bot = new dep.Eris(config.discord.token, { restMode: true });
var spawner = new Spawner({
    discord: bot,
    irc
});
global.spawner = spawner;

/**
 * Time to init the bots
 */
async function init() {
    logger.init('Initializing discord.');
    await spawner.spawnAll();
    irc.init(VERSION, botEmitter);
    logger.verbose('IRC finished?');
    const website = require('./backend/main');
    await website.init();
}

botEmitter.on('ircInit', () => {
    logger.init('Discord ready. Time to initialize IRC.');
    irc.init(VERSION, botEmitter);
});

botEmitter.on('reloadBu', () => {
    global.bu = reload('./util.js');
});

init();