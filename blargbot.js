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
    var config = JSON.parse(configFile);
} else {
    config = {};
    saveConfig();
}
var VERSION = config.version;


function reloadConfig() {
    console.log('Attempting to reload config');
    fs.readFile(path.join(__dirname, 'config.json'), 'utf8', function (err, data) {
        if (err) throw err;
        config = JSON.parse(data);
    });
}

function saveConfig() {
    fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 4));
}




/** Database Stuff */
var databaseFile;
if (config.general.databasedir) {
    if (config.general.databasedir.startsWith('/'))
        databaseFile = config.general.databasedir;
    else
        databaseFile = path.join(__dirname, config.general.databasedir);
} else
    databaseFile = path.join(__dirname, 'data.db');
var db = mysql.createConnection({
    host: config.sql.host,
    user: config.sql.user,
    password: config.sql.pass,
    database: config.sql.database,
    charset: 'utf8mb4'
});

db.connect(err => {
    if (err) console.log(err);
    else {
        console.log('Connected to MySQL Database');
        db.query(`create table if not exists command (
    commandname VARCHAR(30) PRIMARY KEY,
    info TEXT,
    cusage TEXT,
    type INT(11)
)`);

        db.query(`create table if not exists vars (
        varname VARCHAR(30) PRIMARY KEY,
        varvalue TEXT
    )`);

        db.query(`CREATE TABLE if not exists user (
        userid VARCHAR(30) PRIMARY KEY, 
        username TEXT,
        isbot INTEGER,
        lastspoke DATETIME,
        lastchannel TEXT,
        lastcommand TEXT,
        lastcommanddate DATETIME,
        messagecount INTEGER DEFAULT 0
        )`);

        db.query(`CREATE TABLE if not exists todo (
            userid VARCHAR(30),
            itemid INTEGER,
            content TEXT,
            primary key(userid, itemid)
        )`);

        db.query(`CREATE TABLE if not exists stats (
        commandname varchar(30) primary key,
        uses integer,
        lastused DATETIME default NOW()
        )`);

        db.query(`CREATE TABLE if not exists guild (
        guildid VARCHAR(30) PRIMARY KEY, 
        active bool default 1
        )`);

        db.query(`CREATE TABLE if not exists guildsetting (
        guildid VARCHAR(30),
        name VARCHAR(30),
        value VARCHAR(100),
        PRIMARY KEY (guildid, name),
        foreign key (guildid) references guild(guildid)
        )`);

        db.query(`CREATE TABLE if not exists ccommand (
        commandname VARCHAR(30), 
        guildid VARCHAR(30),
        content TEXT,
        primary key (commandname, guildid),
        foreign key (guildid) references guild(guildid)
        )`);

        db.query(`CREATE TABLE IF NOT EXISTS channel (
    channelid VARCHAR(30) PRIMARY KEY,
    guildid VARCHAR(30),
    foreign key (guildid) references guild(guildid)
)`);


        db.query(`CREATE TABLE IF NOT EXISTS modlog (
            guildid VARCHAR(30),
            caseid INTEGER,
            userid VARCHAR(30),
            modid VARCHAR(30),
            type TEXT,
            reason TEXT,
            msgid TEXT,
            primary key (guildid, caseid),
            foreign key (userid) references user(userid),
            foreign key (modid) references user(userid),
            foreign key (guildid) references guild(guildid)
        )`);

        db.query(`CREATE TABLE IF NOT EXISTs chatlogs (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            content TEXT,
            attachment TEXT,
            userid VARCHAR(30),
            msgid TEXT,
            channelid TEXT,
            guildid VARCHAR(30),
            msgtime DATETIME,
            nsfw INTEGER,
            mentions TEXT,
            foreign key (userid) references user(userid),       
            foreign key (guildid) references guild(guildid)            
        )`);

        db.query(`CREATE TABLE IF NOT EXISTs catchat (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            content TEXT,
            attachment TEXT,
            msgid TEXT,
            channelid TEXT,
            guildid VARCHAR(30),
            msgtime DATETIME,
            nsfw INTEGER,
            foreign key (guildid) references guild(guildid)            
                    )`);

        db.query(`create table if not exists tag (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        author VARCHAR(30),
        contents TEXT,
        title TEXT,
        lastmodified DATETIME,
        foreign key (author) references user(userid)
        )`);

        db.query(`create table if not exists username (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            userid VARCHAR(30),
            username TEXT,
            namedate DATETIME DEFAULT CURRENT_TIMESTAMP,
            foreign key (userid) references user(userid)
        )`);
        setTimeout(() => {
            init();
        }, 500);
    }
});

//db.serialize(function () {


//});

/**
 * Time to init the bots
 */
function init() {
    irc.init(VERSION, config, botEmitter);
    discord.init(VERSION, config, botEmitter, db);
    catbot.init(config, db);
}




