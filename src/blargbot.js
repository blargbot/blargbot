/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:26:13
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-06 09:40:38
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

global.dep = require('./core/dep.js');

const reload = dep.reload(require);
const EventEmitter = require('eventemitter3');
global.Promise = require('bluebird');
const botEmitter = new EventEmitter();
const Spawner = require('./structures/Spawner');

var irc = require('./core/irc.js');

/** CONFIG STUFF **/
global.config = require('../config.json');
global.bu = require('./core/util.js');
bu.init();

/** LOGGING STUFF **/

console.log = function (...args) {
    logger.debug(...args);
};


var VERSION = config.version;

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