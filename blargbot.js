global.dep = require('./dep.js');

const reload = dep.reload(require);
const EventEmitter = require('eventemitter3');
global.Promise = require('bluebird');
const botEmitter = new EventEmitter();

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
    discord.init(VERSION, config, botEmitter);
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
if (dep.fs.existsSync(dep.path.join(__dirname, 'config.json'))) {
    var configFile = dep.fs.readFileSync(dep.path.join(__dirname, 'config.json'), 'utf8');
    global.config = JSON.parse(configFile);
} else {
    global.config = {};
    saveConfig();
}
global.bu = require('./util.js');

var VERSION = config.version;

function reloadConfig() {
    logger.info('Attempting to reload config');
    dep.fs.readFile(dep.path.join(__dirname, 'config.json'), 'utf8', function(err, data) {
        if (err) throw err;
        config = JSON.parse(data);
    });
}

function saveConfig() {
    dep.fs.writeFile(dep.path.join(__dirname, 'config.json'), JSON.stringify(config, null, 4));
}

//db.serialize(function () {


//});

/**
 * Time to init the bots
 */
function init() {
    logger.init('Initializing discord.');
    discord.init(VERSION, botEmitter);
}

botEmitter.on('ircInit', () => {
    logger.init('Discord ready. Time to initialize IRC.');
    irc.init(VERSION, botEmitter);
});

botEmitter.on('reloadBu', () => {
    global.bu = reload('./util.js');
});

init();