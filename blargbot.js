var fs = require('fs');
var util = require('util');
var moment = require('moment-timezone');
var mkdirp = require('mkdirp');
var path = require('path');
var reload = require('require-reload')(require);
var Cleverbot = require('cleverbot-node');
var mysql = require('mysql');
cleverbot = new Cleverbot();
const EventEmitter = require('eventemitter3');
global.Promise = require('bluebird');
class BotEmitter extends EventEmitter {}
const botEmitter = new BotEmitter();

var irc = require('./irc.js');
var discord = require('./discord.js');
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
    discord.init(VERSION, config, botEmitter, db);
});
botEmitter.on('reloadIrc', () => {
    irc.bot.disconnect('Reloading!');
    reload.emptyCache(irc.requireCtx);
    irc = reload('./irc.js');
    irc.init(VERSION, config, botEmitter);
});


/** LOGGING STUFF **/

console.log = function() {
    logger.debug(arguments);
};


/** CONFIG STUFF **/
if (fs.existsSync(path.join(__dirname, 'config.json'))) {
    var configFile = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
    global.config = JSON.parse(configFile);
} else {
    global.config = {};
    saveConfig();
}
global.bu = require('./util.js');

var VERSION = config.version;

function reloadConfig() {
    logger.info('Attempting to reload config');
    fs.readFile(path.join(__dirname, 'config.json'), 'utf8', function(err, data) {
        if (err) throw err;
        config = JSON.parse(data);
    });
}

function saveConfig() {
    fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 4));
}

//db.serialize(function () {


//});

/**
 * Time to init the bots
 */
function init() {
    logger.init('Initializing discord.')
    discord.init(VERSION, botEmitter);
}

botEmitter.on('ircInit', () => {
    logger.init('Discord ready. Time to initialize IRC.')
    irc.init(VERSION, botEmitter);
})

botEmitter.on('reloadBu', () => {
    global.bu = reload('./util.js');
})

init();

