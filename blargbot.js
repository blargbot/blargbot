var fs = require('fs');
var util = require('util');
var moment = require('moment-timezone');
var mkdirp = require('mkdirp');
var path = require('path');
const EventEmitter = require('events');
var reload = require('require-reload')(require);
var Cleverbot = require('cleverbot-node');
var mysql = require('mysql');
cleverbot = new Cleverbot();
var bu = require('./util.js');

class BotEmitter extends EventEmitter { }
const botEmitter = new BotEmitter();
/*
TODO: fix the fucking tags
TODO: modlog
*/
var irc = require('./irc.js');
var discord = require('./discord.js');
var catbot = require('./catbot.js');
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


/** File Stuff */
mkdirp(path.join(__dirname, 'logs'), function () {
    var logFile = fs.createWriteStream(path.join(__dirname, 'logs/' + moment().format().replace(/:/gi, '_') + '.log'), { flags: 'w' });

    var logStdout = process.stdout;

    console.log = function () {
        logFile.write(`[${moment().format(`MM/DD HH:mm:ss`)}] ${util.format.apply(null, arguments)}\n`);
        logStdout.write(`[${moment().format(`MM/DD HH:mm:ss`)}] ${util.format.apply(null, arguments)}\n`);
    };
    console.error = console.log;
});


/** CONFIG STUFF **/
if (fs.existsSync(path.join(__dirname, 'config.json'))) {
    var configFile = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
    bu.config = JSON.parse(configFile);
} else {
    bu.config = {};
    saveConfig();
}
var VERSION = bu.config.version;


function reloadConfig() {
    console.log('Attempting to reload config');
    fs.readFile(path.join(__dirname, 'config.json'), 'utf8', function (err, data) {
        if (err) throw err;
        bu.config = JSON.parse(data);
    });
}

function saveConfig() {
    fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 4));
}




/** Database Stuff */
var databaseFile;
if (bu.config.general.databasedir) {
    if (bu.config.general.databasedir.startsWith('/'))
        databaseFile = bu.config.general.databasedir;
    else
        databaseFile = path.join(__dirname, bu.config.general.databasedir);
} else
    databaseFile = path.join(__dirname, 'data.db');
var db = mysql.createConnection({
    host: bu.config.sql.host,
    user: bu.config.sql.user,
    password: bu.config.sql.pass,
    database: bu.config.sql.database,
    charset: 'utf8mb4'
});

db.connect(err => {
    if (err) console.log(err);
    else {
        console.log('Connected to MySQL Database');
        init();
    }
});

//db.serialize(function () {


//});

/**
 * Time to init the bots
 */
function init() {
    irc.init(bu, VERSION, botEmitter);
    discord.init(bu, VERSION, botEmitter, db);
    catbot.init(bu, db);
}




