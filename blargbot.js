var fs = require('fs');
var util = require('util');
var moment = require('moment-timezone');
var mkdirp = require('mkdirp');
var path = require('path');
var http = require('http');
var https = require('https');
var xml2js = require('xml2js');
var _ = require('lodash');
var gm = require('gm')
var wordsearch = require('wordsearch');
const EventEmitter = require('events')
var reload = require('require-reload')(require)
var Cleverbot = require('cleverbot-node');
cleverbot = new Cleverbot;

class BotEmitter extends EventEmitter { }
const botEmitter = new BotEmitter();

var irc = require('./irc.js')
var discord = require('./discord.js')
var catbot = require('./catbot.js')
botEmitter.on('reloadConfig', () => {
    reloadConfig()
})
botEmitter.on('saveConfig', () => {
    saveConfig()
})
botEmitter.on('reloadDiscord', () => {
    discord.bot.disconnect(false)
    reload.emptyCache(discord.requireCtx)
    discord = reload('./discord.js')
    discord.init(VERSION, config, botEmitter, db)
});
botEmitter.on('reloadIrc', () => {
    irc.bot.disconnect('Reloading!')
    reload.emptyCache(irc.requireCtx)
    irc = reload('./irc.js')
    irc.init(VERSION, config, botEmitter)
});


var VERSION = "4.2.2";
/** LOGGING STUFF **/


/** File Stuff */
mkdirp(path.join(__dirname, 'logs'), function (err) {
    var logFile = fs.createWriteStream(path.join(__dirname, "logs/" + moment().format().replace(/:/gi, "_") + ".log"), { flags: 'w' });

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
    config = {
        "general": {
            "pass": "password",
            "default_auth": "",
            "notification_timer": 600,
            "notifications": true,
            "eat_faces": false,
            "imgflip-user": "username",
            "imgflip-pass": "password",
            "databasedir": "data.db"
        },
        "discord": {
            "channel": "000000000",
            "commands": {},
            "servers": {},
            "token": "token",
            "isbeta": false,
            "blacklist": {},
            "musicGuilds": {}
        },
        "irc": {
            "server": "irc.example.net",
            "channel": "#example",
            "nick": "nickname",
            "nickserv_name": "username",
            "nickserv_pass": "password"
        },
        "insult": {
            "verbs": [
                "smells like",
                "looks like",
                "is",
                "sounds like",
                "appears to be",
                "wants to be",
                "looks just like",
                "smells oddly similar to",
                "is jealous of",
                "is as stupid as",
                "laughs like"
            ],
            "nouns": [
                "mother",
                "mom",
                "father",
                "dad",
                "goat",
                "cheese",
                "dick",
                "boob",
                "eye",
                "mouth",
                "nose",
                "ear",
                "sister",
                "sis",
                "brother",
                "bro",
                "seagull",
                "tea",
                "mother-in-law",
                "rabbit",
                "dog",
                "cat",
                "left foot",
                "body",
                "brain",
                "face",
                "favourite thing"
            ],
            "adjectives": [
                "a piece of cheese",
                "a smelly fish",
                "jam",
                "tea",
                "a skunk",
                "a fart",
                "a piece of toast",
                "my mom",
                "your mom",
                "my dad",
                "your dad",
                "my sister",
                "your sister",
                "my brother",
                "your brother",
                "my cat",
                "my dog",
                "my lizard",
                "my seagull",
                "gross",
                "farts",
                "ugly",
                "Captain America",
                "javascript",
                "C#",
                "LUA",
                "python3.5",
                "a furry",
                "an anthropomorphic horse",
                "a tentacle monster",
                "fuck",
                "meow",
                "mississippi",
                "the entire UK",
                "Japan",
                "anime",
                "dickgirls",
                "a really stupid cat",
                "a sentient robot",
                "teaching a robot to love",
                "anime girls with really large boobs who want to eat all of your cream",
                "salty",
                "smegma",
                "mouldy cheese",
                "obesity",
                "Donald Trump",
                "stupid people",
                "crabcakes",
                "firepoles",
                "blue waffle",
                "a really bad random insult generators",
                "a terrible AI",
                "cleverbot",
                "b1nzy",
                "a drunken goblin",
                "poorly censored porn",
                "an egg left in the sun for too long",
                "#BREXIT",
                "leaving the EU"
            ]
        }
    };
    saveConfig();
}

function reloadConfig() {
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
var exists = fs.existsSync(databaseFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(databaseFile);


db.serialize(function () {
    db.run(`create table if not exists vars (
        varname TEXT PRIMARY KEY,
        varvalue TEXT
    )`)

    db.run(`CREATE TABLE if not exists user (
        userid TEXT PRIMARY KEY, 
        username TEXT,
        isbot INTEGER,
        lastspoke DATETIME,
        lastchannel TEXT,
        lastcommand TEXT,
        lastcommanddate DATETIME,
        messagecount INTEGER DEFAULT 0
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS modlog (
            guildid TEXT,
            caseid INTEGER,
            userid TEXT,
            modid TEXT,
            type TEXT,
            reason TEXT,
            msgid TEXT,
            primary key (guildid, caseid)
        )`)

    db.run(`CREATE TABLE IF NOT EXISTs chatlogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            attachment TEXT,
            userid TEXT,
            msgid TEXT,
            channelid TEXT,
            guildid TEXT,
            msgtime DATETIME,
            nsfw INTEGER,
            mentions TEXT,
            foreign key (userid) references user(userid)            
        )`)

    db.run(`CREATE TABLE IF NOT EXISTs catchat (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            attachment TEXT,
            msgid TEXT,
            channelid TEXT,
            guildid TEXT,
            msgtime DATETIME,
            nsfw INTEGER
                    )`)

    db.run(`create table if not exists tag (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT,
        contents TEXT,
        title TEXT,
        lastmodified DATETIME,
        foreign key (author) references user(userid)
        )`);

    db.run(`create table if not exists username (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userid TEXT,
            username TEXT,
            namedate DATETIME DEFAULT CURRENT_TIMESTAMP,
            foreign key (userid) references user(userid)
        )`)
});


/**
 * Time to init the bots
 */
irc.init(VERSION, config, botEmitter)
discord.init(VERSION, config, botEmitter, db)
catbot.init(config, db)



