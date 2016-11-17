const fs = require('fs');
const util = require('util');
const Eris = require('eris');
const moment = require('moment-timezone');
const path = require('path');
const https = require('https');
const tags = require('./tags.js');
const reload = require('require-reload')(require);
const request = require('request');
const Promise = require('promise');
//const webInterface = require('./interface.js');
var bot;
const Cleverbot = require('cleverbot-node');
const website = require('./backend/main');
const cleverbot = new Cleverbot();
var eventTimer;

var e = module.exports = {},
    avatars, vars, emitter, bot, VERSION;

e.requireCtx = require;


/**
 * Initializes every command found in the dcommands directory
 * - hooray for modules!
 */
async function initCommands() {
    //	await r.table('command').delete().run();
    var fileArray = fs.readdirSync(path.join(__dirname, 'dcommands'));
    for (var i = 0; i < fileArray.length; i++) {
        var commandFile = fileArray[i];
        if (/.+\.js$/.test(commandFile)) {
            var commandName = commandFile.match(/(.+)\.js$/)[1];
            loadCommand(commandName);
            logger.init(`${i < 10 ? ' ' : ''}${i}.`, 'Loading command module ', commandName);
        } else {
            logger.init('     Skipping non-command ', commandFile);

        }
    }
}


/**
 * Reloads a specific command
 * @param commandName - the name of the command to reload (String)
 */
function reloadCommand(commandName) {
    if (bu.commands[commandName]) {
        logger.init(`${1 < 10 ? ' ' : ''}${1}.`, 'Reloading command module ', commandName);
        if (bu.commands[commandName].shutdown)
            bu.commands[commandName].shutdown();
        bu.commands[commandName] = reload(`./dcommands/${commandName}.js`);
        buildCommand(commandName);
    }
}

/**
 * Unloads a specific command
 * @param commandName - the name of the command to unload (String)
 */
function unloadCommand(commandName) {
    if (bu.commands[commandName]) {
        logger.init(`${1 < 10 ? ' ' : ''}${1}.`, 'Unloading command module ', commandName);

        if (bu.commands[commandName].sub) {
            for (var subCommand in bu.commands[commandName].sub) {
                logger.init(`    Unloading ${commandName}'s subcommand`, subCommand);
                delete bu.commandList[subCommand];
            }
        }
        delete bu.commandList[commandName];
        if (bu.commands[commandName].alias) {
            for (var ii = 0; ii < bu.commands[commandName].alias.length; ii++) {
                logger.init(`    Unloading ${commandName}'s alias`, bu.commands[commandName].alias[ii]);
                delete bu.commandList[bu.commands[commandName].alias[ii]];
            }
        }
    }
}

/**
 * Loads a specific command
 * @param commandName - the name of the command to load (String)
 */
function loadCommand(commandName) {
    try {
        bu.commands[commandName] = require(`./dcommands/${commandName}.js`);
        if (bu.commands[commandName].isCommand) {
            buildCommand(commandName);
        } else {
            logger.init('     Skipping non-command ', commandName + '.js');
        }
    } catch (err) {
        logger.warn(err);
        logger.init(`     Failed to load command ${commandName}!`);
    }
}

// Refactored a major part of loadCommand and reloadCommand into this
function buildCommand(commandName) {
    try {
        bu.commands[commandName].init();
        var command = {
            name: commandName,
            usage: bu.commands[commandName].usage,
            info: bu.commands[commandName].info,
            hidden: bu.commands[commandName].hidden,
            category: bu.commands[commandName].category
        };
        /*
        if (bu.commands[commandName].longinfo) {
        r.table('command').insert({
        name: commandName,
        usage: command.usage.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
        info: bu.commands[commandName].longinfo,
        type: command.category
        }).run();
        }
        */
        if (bu.commands[commandName].sub) {
            for (var subCommand in bu.commands[commandName].sub) {
                logger.init(`    Loading ${commandName}'s subcommand`, subCommand);

                bu.commandList[subCommand] = {
                    name: commandName,
                    usage: bu.commands[commandName].sub[subCommand].usage,
                    info: bu.commands[commandName].sub[subCommand].info,
                    hidden: bu.commands[commandName].hidden,
                    category: bu.commands[commandName].category
                };
            }
        }
        bu.commandList[commandName] = command;
        if (bu.commands[commandName].alias) {
            for (var ii = 0; ii < bu.commands[commandName].alias.length; ii++) {
                logger.init(`    Loading ${commandName}'s alias`, bu.commands[commandName].alias[ii]);
                bu.commandList[bu.commands[commandName].alias[ii]] = command;
            }
        }
    } catch (err) {
        logger.error(err);
    }
}

var debug = false;
var warn = true;
var error = true;

/**
 * Initializes the bot
 * @param v - the version number (String)
 * @param topConfig - the config file (Object)
 * @param em - the event emitter (EventEmitter)
 */
e.init = async function(v, em) {
    VERSION = v;
    emitter = em;
    logger.debug('HELLOOOOO?');
    process.on('unhandledRejection', (reason, p) => {
        logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
    });
    if (fs.existsSync(path.join(__dirname, 'vars.json'))) {
        var varsFile = fs.readFileSync(path.join(__dirname, 'vars.json'), 'utf8');
        vars = JSON.parse(varsFile);
    } else {
        vars = {};
        saveVars();
    }
    bot = new Eris.Client(config.discord.token, {
        autoReconnect: true,
        disableEveryone: true,
        disableEvents: {
            //PRESENCE_UPDATE: true,
            //   VOICE_STATE_UPDATE: true,
            TYPING_START: true
        },
        getAllUsers: true,
        maxShards: config.discord.shards || 1
    });
    global.bot = bot;

    bu.init();
    bu.emitter = em;
    bu.VERSION = v;
    bu.startTime = startTime;
    bu.vars = vars;
    tags.init();
    //  webInterface.init(bot, bu);

    /**
     * EventEmitter stuff
     */
    // emitter.on('reloadInterface', () => {
    //      reloadInterface();
    //   });
    emitter.on('discordMessage', (message, attachment) => {
        if (attachment)
            bu.send(config.discord.channel, message, attachment);
        else
            bu.send(config.discord.channel, message);
    });

    emitter.on('discordTopic', (topic) => {
        bot.editChannel(config.discord.channel, {
            topic: topic
        });
    });

    emitter.on('eval', (msg, text) => {
        eval1(msg, text);
    });
    emitter.on('eval2', (msg, text) => {
        eval2(msg, text);
    });

    emitter.on('reloadCommand', (commandName) => {
        reloadCommand(commandName);
    });
    emitter.on('loadCommand', (commandName) => {
        loadCommand(commandName);
    });
    emitter.on('unloadCommand', (commandName) => {
        unloadCommand(commandName);
    });
    emitter.on('saveVars', () => {
        saveVars();
    });

    avatars = JSON.parse(fs.readFileSync(path.join(__dirname, `avatars${config.general.isbeta ? '' : 2}.json`), 'utf8'));

    registerListeners();

    initCommands();
    website.init();
    logger.init('Connecting...');

    registerChangefeed();

    bot.connect();
};


/**
 * Reloads the misc variables object
 */
function reloadVars() {
    fs.readFileSync(path.join(__dirname, 'vars.json'), 'utf8', function(err, data) {
        if (err) throw err;
        vars = JSON.parse(data);
    });
}

/**
 * Saves the misc variables to a file
 */
function saveVars() {
    fs.writeFileSync(path.join(__dirname, 'vars.json'), JSON.stringify(vars, null, 4));
}

var gameId;
/**
 * Switches the game the bot is playing
 * @param forced - if true, will not set a timeout (Boolean)
 */
function switchGame(forced) {
    var name = '';
    var oldId = gameId;
    while (oldId == gameId) {
        gameId = bu.getRandomInt(0, 6);
    }
    switch (gameId) {
        case 0:
            name = `with ${bot.users.size} users!`;
            break;
        case 1:
            name = `in ${bot.guilds.size} guilds!`;
            break;
        case 2:
            name = `in ${Object.keys(bot.channelGuildMap).length} channels!`;
            break;
        case 3:
            name = `with tiny bits of string!`;
            break;
        case 4:
            name = `with delicious fish!`;
            break;
        case 5:
            name = `on version ${bu.VERSION}!`;
            break;
        case 6:
            name = `type 'blargbot help'!`;
            break;
    }
    bot.editStatus(null, {
        name: name
    });
    if (!forced)
        setTimeout(function() {
            switchGame();
        }, 60000);
}


/**
 * Switches the avatar
 * @param forced - if true, will not set a timeout (Boolean)
 */
function switchAvatar(forced) {
    bot.editSelf({
        avatar: avatars[bu.avatarId]
    });
    bu.avatarId++;
    if (bu.avatarId == 8)
        bu.avatarId = 0;
    if (!forced)
        setTimeout(function() {
            switchAvatar();
        }, 600000);
}
var commandMessages = {};
var handleDiscordCommand = async function(channel, user, text, msg) {
    let words = bu.splitInput(text);
    if (msg.channel.guild)
        logger.command(`Command '${text}' executed by ${user.username} (${user.id}) on server ${msg.channel.guild.name} (${msg.channel.guild.id}) on channel ${msg.channel.name} (${msg.channel.id}) Message ID: ${msg.id}`);
    else
        logger.command(`Command '${text}' executed by ${user.username} (${user.id}) in a PM (${msg.channel.id}) Message ID: ${msg.id}`);

    if (msg.author.bot) {
        return false;
    }
    let val = await bu.ccommand.get(msg.channel.guild ? msg.channel.guild.id : '', words[0]);
    if (val) {
        var command = text.replace(words[0], '').trim();
        command = bu.fixContent(command);
        var response = await tags.processTag(msg, val, command);
        if (response !== 'null') {
            bu.send(channel.id, response);
        }
        return true;
    } else {
        if (config.discord.commands[words[0]] != null) {

            return true;
        } else {
            if (bu.commandList.hasOwnProperty(words[0].toLowerCase())) {
                let commandName = bu.commandList[words[0].toLowerCase()].name;
                let val2 = await bu.canExecuteCommand(msg, commandName);
                if (val2[0]) {
                    executeCommand(commandName, msg, words, text);
                }
                return val2[0];
            } else {
                return false;
            }
        }
    }
};
var executeCommand = async function(commandName, msg, words, text) {
    r.table('stats').get(commandName).update({
        uses: r.row('uses').add(1),
        lastused: r.epochTime(moment() / 1000)
    }).run();
    if (bu.commandStats.hasOwnProperty(commandName)) {
        bu.commandStats[commandName]++;
    } else {
        bu.commandStats[commandName] = 1;
    }
    bu.commandUses++;
    bu.commands[commandName].execute(msg, words, text);
    return true;
};

var messageLogs = [];
var messageI = 0;
/**
 * Function to be called manually (through eval) to generate logs for any given channel
 * @param channelid - channel id (String)
 * @param msgid - id of starting message (String)
 * @param times - number of times to repeat the cycle (int)
 */
function createLogs(channelid, msgid, times) {
    if (messageI < times)
        bot.getMessages(channelid, 100, msgid).then((kek) => {
            logger.info(`finished ${messageI + 1}/${times}`);
            for (var i = 0; i < kek.length; i++) {
                messageLogs.push(`${kek[i].author.username}> ${kek[i].author.id}> ${kek[i].content}`);
            }
            messageI++;
            setTimeout(() => {
                createLogs(channelid, kek[kek.length - 1].id, times);
            }, 5000);
        });
    else {}
}
/**
 * Function to be used with createLogs
 * @param name - file name (String)
 */
function saveLogs(name) {
    messageI = 0;
    fs.writeFile(path.join(__dirname, name), JSON.stringify(messageLogs, null, 4));
}
/**
 * Posts stats about the bot to https://bots.discord.pw
 */
function postStats() {
    var stats = {
        'server_count': bot.guilds.size
    };
    request.post({
        'url': `https://bots.discord.pw/api/bots/${bot.user.id}/stats`,
        'headers': {
            'content-type': 'application/json',
            'Authorization': config.general.botlisttoken,
            'User-Agent': 'blargbot/1.0 (ratismal)'
        },
        'json': true,
        body: stats
    }, (err) => {
        if (err) logger.error(err);
    });

    if (!config.general.isbeta) {
        logger.info('Posting to matt');

        request.post({
            'url': 'https://www.carbonitex.net/discord/data/botdata.php',
            'headers': {
                'content-type': 'application/json'
            },
            'json': true,
            body: {
                'key': config.general.carbontoken,
                'servercount': bot.guilds.size,
                'logoid': bot.user.avatar
            }
        }, (err) => {
            if (err) logger.error(err);
        });
    }
}

var lastUserStatsKek;
/**
 * Gets information about a bot - test function
 * @param id - id of bot
 */
function fml(id) {
    var options = {
        hostname: 'bots.discord.pw',
        method: 'GET',
        port: 443,
        path: `/api/users/${id}`,
        headers: {
            'User-Agent': 'blargbot/1.0 (ratismal)',
            'Authorization': vars.botlisttoken
        }
    };

    var req = https.request(options, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            logger.debug(chunk);
            body += chunk;
        });

        res.on('end', function() {
            logger.debug('body: ' + body);
            lastUserStatsKek = JSON.parse(body);
            logger.debug(lastUserStatsKek);
        });

        res.on('error', function(thing) {
            logger.warn(`Result Error: ${thing}`);
        });
    });
    req.on('error', function(err) {
        logger.warn(`Request Error: ${err}`);
    });
    req.end();

}

/**
 * Displays the contents of a function
 * @param msg - message
 * @param text - command text
 */
function eval2(msg, text) {
    if (msg.author.id === bu.CAT_ID) {
        var commandToProcess = text.replace('eval2 ', '');
        logger.debug(commandToProcess);
        try {
            bu.send(msg, `\`\`\`js
${eval(commandToProcess)})}
\`\`\``);
        } catch (err) {
            bu.send(msg, err.message);
        }
    } else {
        bu.send(msg, `You don't own me!`);
    }
}
/**
 * Evaluates code
 * @param msg - message (Message)
 * @param text - command text (String)
 */
async function eval1(msg, text) {
    if (msg.author.id === bu.CAT_ID) {

        var commandToProcess = text.replace('eval ', '');
        if (commandToProcess.startsWith('```js') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(6, commandToProcess.length - 3);
        else if (commandToProcess.startsWith('```') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(4, commandToProcess.length - 3);

        //		let splitCom = commandToProcess.split('\n');
        //	splitCom[splitCom.length - 1] = 'return ' + splitCom[splitCom.length - 1];
        //		commandToProcess = splitCom.join('\n');
        let toEval = `async function letsEval() {
try {
${commandToProcess}
} catch (err) {
return err;
}
}
letsEval().then(m => {
logger.debug(util.inspect(m, {depth: 1}));
bu.send(msg, \`Input:
\\\`\\\`\\\`js
\${commandToProcess}
\\\`\\\`\\\`
Output:
\\\`\\\`\\\`js
\${commandToProcess == '1/0' ? 1 : m}
\\\`\\\`\\\`\`);
if (commandToProcess.indexOf('vars') > -1) {
saveVars();
}
return m;
}).catch(err => {
bu.send(msg, \`An error occured!
\\\`\\\`\\\`js
\${err.stack}
\\\`\\\`\\\`\`);
})`;
        logger.debug(toEval);
        try {
            eval(toEval);
        } catch (err) {
            bu.send(msg, `An error occured!
\`\`\`js
${err.stack}
\`\`\``);
        }
    }
};

/**
 * Processes a user into the database
 * @param msg - message (Message)
 */
var processUser = async function(msg) {
    let storedUser = await r.table('user').get(msg.author.id).run();
    if (!storedUser) {
        logger.debug(`inserting user ${msg.author.id} (${msg.author.username})`);
        r.table('user').insert({
            userid: msg.author.id,
            username: msg.author.username,
            usernames: [{
                name: msg.author.username,
                date: r.epochTime(moment() / 1000)
            }],
            isbot: msg.author.bot,
            lastspoke: r.epochTime(moment() / 1000),
            lastcommand: null,
            lastcommanddate: null,
            messagecount: 1,
            discriminator: msg.author.discriminator,
            todo: []
        }).run();
    } else {
        let newUser = {
            lastspoke: r.epochTime(moment() / 1000),
            lastchannel: msg.channel.id,
            messagecount: storedUser.messagecount + 1
        };
        if (storedUser.username != msg.author.username) {
            newUser.username = msg.author.username;
            newUser.usernames = storedUser.usernames;
            newUser.usernames.push({
                name: msg.author.username,
                date: r.epochTime(moment() / 1000)
            });
        }
        if (storedUser.discriminator != msg.author.discriminator) {
            newUser.discriminator = msg.author.discriminator;
        }
        if (storedUser.avatarURL != msg.author.avatarURL) {
            newUser.avatarURL = msg.author.avatarURL;
        }
        r.table('user').get(msg.author.id).update(newUser).run();
    }
};

var startTime = moment();

/**
 * Sends a message to irc
 * @param msg - the message to send (String)
 */
function sendMessageToIrc(msg) {
    emitter.emit('ircMessage', msg);
}
var tables = {
    flip: {
        prod: [
            'Whoops! Let me get that for you ┬──┬﻿ ¯\\\\_(ツ)',
            '(ヘ･_･)ヘ┳━┳ What are you, an animal?',
            'Can you not? ヘ(´° □°)ヘ┳━┳',
            'Tables are not meant to be flipped ┬──┬ ノ( ゜-゜ノ)'
        ],
        beta: [
            '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Wheee!',
            '┻━┻ ︵ヽ(`Д´)ﾉ︵﻿ ┻━┻ Get these tables out of my face!',
            '┻━┻ミ＼(≧ﾛ≦＼) Hey, catch!',
            'Flipping tables with elegance! (/¯◡ ‿ ◡)/¯ ~ ┻━┻'
        ]
    },
    unflip: {
        prod: [
            '┬──┬﻿ ¯\\\\_(ツ) A table unflipped is a table saved!',
            '┣ﾍ(≧∇≦ﾍ)… (≧∇≦)/┳━┳ Unflip that table!',
            'Yay! Cleaning up! ┣ﾍ(^▽^ﾍ)Ξ(ﾟ▽ﾟ*)ﾉ┳━┳',
            'ヘ(´° □°)ヘ┳━┳ Was that so hard?'
        ],
        beta: [
            '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Here comes the entropy!',
            'I\'m sorry, did you just pick that up? ༼ﾉຈل͜ຈ༽ﾉ︵┻━┻',
            'Get back on the ground! (╯ರ ~ ರ）╯︵ ┻━┻',
            'No need to be so serious! (ﾉ≧∇≦)ﾉ ﾐ ┸━┸'
        ]
    }
};

var flipTables = async function(msg, unflip) {
    let tableflip = await bu.guildSettings.get(msg.channel.guild.id, 'tableflip');
    if (tableflip && tableflip != 0) {
        var seed = bu.getRandomInt(0, 3);
        bu.send(msg,
            tables[unflip ? 'unflip' : 'flip'][config.general.isbeta ? 'beta' : 'prod'][seed]);
    }
};
/*
function reloadInterface() {
    webInterface.kill();
    webInterface = reload('./interface.js');
    webInterface.init(bot, bu);
}
*/
function registerListeners() {
    bot.on('debug', function(message, id) {
        if (debug)
            logger.debug(`[${moment().format('MM/DD HH:mm:ss')}][DEBUG][${id}] ${message}`);
        return 'no';
    });

    bot.on('warn', function(message, id) {
        if (warn)
            logger.warn(`[${moment().format('MM/DD HH:mm:ss')}][WARN][${id}] ${message}`);
    });

    bot.on('error', function(err, id) {
        if (error)
            logger.error(`[${moment().format('MM/DD HH:mm:ss')}][ERROR][${id}] ${err.stack}`);
    });

    bot.on('shardDisconnect', async function(err, id) {
        if (err) {
            logger.error(`[SHARD ${id}] Disconnected: ${err.stack}`);
        } else {
            logger.shard(`${id} Disconnected!`);
        }
    });

    bot.on('shardPreReady', async function(id) {
        logger.shard(`${id} Pre-Ready!`);
    });
    bot.on('shardReady', async function(id) {
        let shard = bot.shards.get(id);
        logger.shard(`${id} Ready! G:${shard.guildCount}`);
    });
    bot.on('shardResume', async function(id) {
        let shard = bot.shards.get(id);
        logger.shard(`${id} Resumed! G:${shard.guildCount}`);
    });

    bot.on('ready', async function() {
        logger.init('Ready!');
        let restart = await r.table('vars').get('restart').run();
        if (restart && restart.varvalue) {
            bu.send(restart.varvalue.channel, 'Ok I\'m back. It took me ' + bu.createTimeDiffString(moment(), moment(restart.varvalue.time)) + '.');
            r.table('vars').get('restart').delete().run();
        }

        let guilds = (await r.table('guild').withFields('guildid').run()).map(g => g.guildid);
        //console.dir(guilds);
        bot.guilds.forEach(async function(g) {
            if (guilds.indexOf(g.id) == -1) {
                let guild = bot.guilds.get(g.id);
                let members = guild.memberCount;
                let users = guild.members.filter(m => !m.user.bot).length;
                let bots = guild.members.filter(m => m.user.bot).length;
                let percent = Math.floor(bots / members * 10000) / 100;
                var message = `:ballot_box_with_check: Guild: \`${guild.name}\`` +
                    ` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n   Total: **${members}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
                bu.send(`205153826162868225`, message);

                console.log('Inserting a missing guild ' + g.id);
                await r.table('guild').insert({
                    guildid: g.id,
                    active: true,
                    name: g.name,
                    settings: {},
                    channels: {},
                    commandperms: {},
                    ccommands: {},
                    modlog: []
                }).run();
            }
            bu.guildCache[g.id] = await r.table('guild').get(g.id);
        });

        gameId = bu.getRandomInt(0, 4);
        if (config.general.isbeta)
            bu.avatarId = 4;
        else
            bu.avatarId = 0;
        switchGame();
        switchAvatar();
        postStats();
        if (eventTimer == undefined) {
            initEvents();
        }
    });

    bot.on('guildMemberAdd', async function(guild, member) {
        let val = await bu.guildSettings.get(guild.id, 'greeting');
        if (val) {
            var message = await tags.processTag({
                channel: guild.defaultChannel,
                author: member.user,
                member: member
            }, val, '');
            bu.send(guild.defaultChannel.id, message);
        }
        bu.logEvent(guild.id, 'memberjoin', `**User:** ${member.user.username}#${member.user.discriminator} (${member.user.id})`);
    });

    bot.on('guildDelete', async function(guild) {
        postStats();
        logger.debug('removed from guild');
        let members = guild.memberCount;
        let users = guild.members.filter(m => !m.user.bot).length;
        let bots = guild.members.filter(m => m.user.bot).length;
        let percent = Math.floor(bots / members * 10000) / 100;
        var message = `:x: Guild: \`${guild.name}\`` +
            ` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n   Total: **${members}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
        bu.send(`205153826162868225`, message);


        r.table('guild').get(guild.id).update({
            active: false
        }).run();
        let channel = await bot.getDMChannel(guild.ownerID);
        bu.send(channel.id, `Hi!
I see I was removed from your guild **${guild.name}**, and I'm sorry I wasn't able to live up to your expectations.
If it's not too much trouble, could you please tell me why you decided to remove me, what you didn't like about me, or what you think could be improved? It would be very helpful.
You can do this by typing \`suggest <suggestion>\` right in this DM. Thank you for your time!`);
    });

    bot.on('guildMemberRemove', async function(guild, member) {
        let val = await bu.guildSettings.get(guild.id, 'farewell');
        if (val) {
            var message = await tags.processTag({
                channel: guild.defaultChannel,
                author: member.user,
                member: member
            }, val, '');
            bu.send(guild.defaultChannel.id, message);
        }
        bu.logEvent(guild.id, 'memberleave', `**User:** ${member.user.username}#${member.user.discriminator} (${member.user.id})`);
    });

    bot.on('guildCreate', async function(guild) {
        postStats();
        logger.debug('added to guild');
        let storedGuild = await bu.getGuild(guild.id);
        if (!storedGuild || !storedGuild.active) {
            let members = guild.memberCount;
            let users = guild.members.filter(m => !m.user.bot).length;
            let bots = guild.members.filter(m => m.user.bot).length;
            let percent = Math.floor(bots / members * 10000) / 100;
            var message = `:white_check_mark: Guild: \`${guild.name}\`` +
                ` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n   Total: **${members}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
            bu.send(`205153826162868225`, message);
            if (bot.guilds.size % 100 == 0) {
                bu.send(`205153826162868225`, `🎉 I'm now ` +
                    `in ${bot.guilds.size} guilds! 🎉`);
            }
            if (bot.guilds.size % 1000 == 0) {
                bu.send(`229135592720433152`, `🎊🎉🎊🎉 I'm now ` +
                    `in ${bot.guilds.size} guilds! WHOOOOO! 🎉🎊🎉🎊`);
            }
            var message2 = `Hi! My name is blargbot, a multifunctional discord bot here to serve you!
- 💻 For command information, please do \`${config.discord.defaultPrefix}help\`!
- 📢 For Bot Commander commands, please make sure you have a role titled \`Bot Commander\`.
- 🛠 For Admin commands, please make sure you have a role titled \`Admin\`.
If you are the owner of this server, here are a few things to know.
- 🗨 To enable modlogging, please create a channel for me to log in and do \`${config.discord.defaultPrefix}modlog\`
- 🙈 To mark channels as NSFW, please go to them and do \`${config.discord.defaultPrefix}nsfw\`.
- ❗ To change my command prefix, please do \`${config.discord.defaultPrefix}setprefix <anything>\`.

❓ If you have any questions, comments, or concerns, please do \`${config.discord.defaultPrefix}feedback <feedback>\`. Thanks!
👍 I hope you enjoy my services! 👍`;
            bu.send(guild.id, message2);
            if (!storedGuild) {


                r.table('guild').insert({
                    guildid: guild.id,
                    active: true,
                    name: guild.name,
                    settings: {},
                    channels: {},
                    commandperms: {},
                    ccommands: {},
                    modlog: []
                }).run();

            } else {

                r.table('guild').get(guild.id).update({
                    active: true
                }).run();
            }
        }
    });

    bot.on('messageUpdate', async function(msg, oldmsg) {
        if (!oldmsg) {
            let storedMsg = await r.table('chatlogs')
                .getAll(msg.id, {
                    index: 'msgid'
                })
                .orderBy(r.desc('msgtime')).run();
            if (storedMsg.length > 0) {

                // logger.debug('Somebody deleted an uncached message, but we found it in the DB.', storedMsg);

                storedMsg = storedMsg[0];
                oldmsg.content = storedMsg.content;
                oldmsg.author = bot.users.get(storedMsg.userid) || {
                    id: storedMsg.userid
                };
                oldmsg.cleanContent = storedMsg.content;
                oldmsg.mentions = storedMsg.mentions.split(',').map(m => {
                    return {
                        username: m
                    };
                });
                oldmsg.attachments = [];
                if (storedMsg.attachment) msg.attachments = [{
                    url: storedMsg.attachment
                }];
                oldmsg.channel = bot.getChannel(msg.channelID);

            } else {
                logger.debug('Somebody deleted an uncached message and unstored message.');
                return;
            }
        }
        if (msg.content == oldmsg.content) {
            return;
        }
        if (msg.author.id == bot.user.id) {
            logger.output(`Message ${msg.id} was updated to '${msg.content}''`);
        }
        if (msg.channel.id != '204404225914961920') {
            var nsfw = await bu.isNsfwChannel(msg.channel.id);
            r.table('chatlogs').insert({
                content: msg.content,
                attachment: msg.attachments[0] ? msg.attachments[0].url : null,
                userid: msg.author.id,
                msgid: msg.id,
                channelid: msg.channel.id,
                guildid: msg.channel.guild ? msg.channel.guild.id : 'DM',
                msgtime: r.epochTime(moment(msg.editedTimestamp) / 1000),
                type: 1
            }).run();
        }
        let oldMsg = oldmsg.cleanContent || 'uncached :(';
        let newMsg = msg.cleanContent;
        if (oldMsg.length + newMsg.length > 1900) {
            if (oldMsg.length > 900) oldMsg = oldMsg.substring(0, 900) + '... (too long to display)';
            if (newMsg.length > 900) newMsg = newMsg.substring(0, 900) + '... (too long to display)';
        }
        bu.logEvent(msg.channel.guild.id, 'messageupdate', `**User:** ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})
**Message ID:** ${msg.id}
**Channel:** ${msg.channel.mention}
**Old Message:**
${oldMsg}
**New Message:**
${newMsg}`);
    });

    bot.on('userUpdate', (user, oldUser) => {
        if (oldUser) {
            if (user.id != bot.user.id) {
                let guilds = bot.guilds.filter(g => g.members.get(user.id) != undefined);
                let username;
                let discrim;
                if (oldUser.username != user.username) username = '**Old Name:** ' + oldUser.username + '\n';
                if (oldUser.discriminator != user.discriminator) discrim = '**Old Discriminator:** ' + oldUser.discriminator + '\n';
                let message = `**User:** ${user.username}#${user.discriminator} (${user.id})
${username || ''}${discrim || ''}${user.avatar != oldUser.avatar ? '**New Avatar:** <' + user.avatarURL + '>\n**Old Avatar:** <https://cdn.discordapp.com/avatars/' + user.id + '/' + oldUser.avatar + '.jpg>' : ''}
`;
                guilds.forEach(g => {
                    bu.logEvent(g.id, 'userupdate', message);
                });
            }
        }
    });

    bot.on('guildBanAdd', async function(guild, user) {

        let storedGuild = await bu.getGuild(guild.id);
        let votebans = storedGuild.votebans || {};
        logger.debug(0, votebans);
        if (votebans.hasOwnProperty(user.id)) {
            logger.debug(1, votebans);
            delete votebans[user.id];
            logger.debug(2, votebans);
            r.table('guild').get(guild.id).update({
                votebans: r.literal(votebans)
            });
        }
        var mod;
        var type = 'Ban';
        var reason;
        if (!bu.bans[guild.id])
            bu.bans[guild.id] = {};

        if (bu.bans[guild.id].mass && bu.bans[guild.id].mass.users && bu.bans[guild.id].mass.users.indexOf(user.id) > -1) {
            bu.bans[guild.id].mass.newUsers.push(user);
            bu.bans[guild.id].mass.users.splice(bu.bans[guild.id].mass.users.indexOf(user.id), 1);
            if (bu.bans[guild.id].mass.users.length == 0) {
                mod = bu.bans[guild.id].mass.mod;
                type = bu.bans[guild.id].mass.type;
                reason = bu.bans[guild.id].mass.reason;
                bu.logAction(guild, bu.bans[guild.id].mass.newUsers, mod, type, reason);
            }
            return;
        } else if (bu.bans[guild.id][user.id]) {
            mod = bu.bans[guild.id][user.id].mod;
            type = bu.bans[guild.id][user.id].type;
            reason = bu.bans[guild.id][user.id].reason;
            delete bu.bans[guild.id][user.id];
        }
        bu.logAction(guild, user, mod, type, reason);
        bu.logEvent(guild.id, 'memberban', `**User:** ${user.username}#${user.discriminator} (${user.id})`);
    });

    bot.on('guildBanRemove', async function(guild, user) {
        let storedGuild = await bu.getGuild(guild.id);
        let modlog = storedGuild.modlog || [];
        let lastCase = modlog[modlog.length - 1];
        var mod;
        if (bu.unbans[guild.id] && bu.unbans[guild.id][user.id]) {
            mod = bot.users.get(bu.unbans[guild.id][user.id]);
            delete bu.unbans[guild.id][user.id];
        }
        if (lastCase.userid == user.id) {
            let val = await bu.guildSettings.get(guild.id, 'modlog');

            let msg2 = await bot.getMessage(val, lastCase.msgid);
            let embed = msg2.embeds[0];
            if (embed) {
                embed.fields[0].value = 'Softban';
                embed.color = 0xffee02;
                embed.timestamp = moment(embed.timestamp);

                msg2.edit({
                    content: ' ',
                    embed: embed
                });
            } else {
                bu.logAction(guild, user, mod, 'Unban');
            }
        } else {
            bu.logAction(guild, user, mod, 'Unban');
        }
        bu.logEvent(guild.id, 'memberunban', `**User:** ${user.username}#${user.discriminator} (${user.id})`);
    });

    bot.on('messageDelete', async function(msg) {
        if (!msg.channel) {
            let storedMsg = await r.table('chatlogs')
                .getAll(msg.id, {
                    index: 'msgid'
                })
                .orderBy(r.desc('msgtime')).run();
            if (storedMsg.length > 0) {

                // logger.debug('Somebody deleted an uncached message, but we found it in the DB.', storedMsg);

                storedMsg = storedMsg[0];
                msg.content = storedMsg.content;
                msg.author = bot.users.get(storedMsg.userid) || {
                    id: storedMsg.userid
                };
                msg.mentions = storedMsg.mentions.split(',').map(m => {
                    return {
                        username: m
                    };
                });
                msg.attachments = [];
                if (storedMsg.attachment) msg.attachments = [{
                    url: storedMsg.attachment
                }];
                msg.channel = bot.getChannel(msg.channelID);

            } else {
                logger.debug('Somebody deleted an uncached message and unstored message.');
                msg.channel = bot.getChannel(msg.channelID);
                msg.author = {};
                msg.mentions = [];
                msg.attachments = [];
            }
        }
        if (commandMessages[msg.channel.guild.id] && commandMessages[msg.channel.guild.id].indexOf(msg.id) > -1) {
            let val = await bu.guildSettings.get(msg.channel.guild.id, 'deletenotif');
            if (val && val != 0)
                bu.send(msg, `**${msg.member.nick
|| msg.author.username}** deleted their command message.`);
            commandMessages[msg.channel.guild.id].splice(commandMessages[msg.channel.guild.id].indexOf(msg.id), 1);
        }
        if (msg.channel.id != '204404225914961920') {
            try {
                await r.table('chatlogs').insert({
                    content: msg.content,
                    attachment: msg.attachments && msg.attachments[0] ? msg.attachments[0].url : null,
                    userid: msg.author.id,
                    msgid: msg.id,
                    channelid: msg.channel.id,
                    guildid: msg.channel.guild.id,
                    msgtime: r.epochTime(moment() / 1000),
                    type: 2
                }).run();

                let newMsg = msg.cleanContent || 'uncached :(';
                if (newMsg.length > 1900) newMsg = newMsg.substring(0, 1900) + '... (too long to display)';
                bu.logEvent(msg.channel.guild.id, 'messagedelete', `**User:** ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})
**Message ID:** ${msg.id}
**Channel:** ${msg.channel.mention}
**Message:**
${newMsg}`);
            } catch (err) {

            }
        }
    });


    bot.on('messageCreate', async function(msg) {

        processUser(msg);
        let isDm = msg.channel.guild == undefined;
        let storedGuild;
        if (!isDm) storedGuild = await bu.getGuild(msg.guild.id);


        if (msg.channel.id != '194950328393793536')
            if (msg.author.id == bot.user.id) {
                if (!isDm)
                    logger.output(`${msg.channel.guild.name} (${msg.channel.guild.id})> ${msg.channel.name} ` +
                        `(${msg.channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
                else
                    logger.output(`PM> ${msg.channel.name} (${msg.channel.id})> ` +
                        `${msg.author.username}> ${msg.content} (${msg.id})`);
            }
        if (msg.member && msg.channel.id === config.discord.channel) {
            if (!(msg.author.id == bot.user.id && msg.content.startsWith('\u200B'))) {
                var message;
                if (msg.content.startsWith('_') && msg.content.endsWith('_'))
                    message = ` * ${msg.member && msg.member.nick ? msg.member.nick : msg.author.username} ${msg.cleanContent
.substring(1, msg.cleanContent.length - 1)}`;
                else {
                    if (msg.author.id == bot.user.id) {
                        message = `${msg.cleanContent}`;
                    } else {
                        message = `\<${msg.member && msg.member.nick ? msg.member.nick : msg.author.username}\> ${msg.cleanContent}`;
                    }
                }
                logger.output(message);
                var attachUrl = '';
                if (msg.attachments.length > 0) {
                    logger.debug(util.inspect(msg.attachments[0]));
                    attachUrl += ` ${msg.attachments[0].url}`;
                }
                sendMessageToIrc(message + attachUrl);
            }
        }

        if (msg.author.id !== bot.user.id) {
            let antimention;
            if (!isDm) antimention = storedGuild.settings.antimention;
            var parsedAntiMention = parseInt(antimention);
            if (!(parsedAntiMention == 0 || isNaN(parsedAntiMention))) {
                if (msg.mentions.length >= parsedAntiMention) {
                    logger.info('BANN TIME');
                    if (!bu.bans[msg.channel.guild.id])
                        bu.bans[msg.channel.guild.id] = {};
                    bu.bans[msg.channel.guild.id][msg.author.id] = {
                        mod: bot.user,
                        type: 'Auto-Ban',
                        reason: 'Mention spam'
                    };
                    try {
                        await bot.banGuildMember(msg.channel.guild.id, msg.author.id, 1);
                    } catch (err) {
                        delete bu.bans[msg.channel.guild.id][msg.author.id];
                        bu.send(msg, `${msg.author.username} is mention spamming, but I lack the permissions to ban them!`);
                    }
                    return;
                }
            }

            if (storedGuild && storedGuild.roleme) {
                let roleme = storedGuild.roleme.filter(m => m.channels.indexOf(msg.channel.id) > -1 || m.channels.length == 0);
                if (roleme.length > 0) {
                    for (let i = 0; i < roleme.length; i++) {
                        let caseSensitive = roleme[i].casesensitive;
                        let message = roleme[i].message;
                        let content = msg.content;
                        if (!caseSensitive) {
                            message = message.toLowerCase();
                            content = content.toLowerCase();
                        }
                        if (message == content) {
                            let roleList = msg.member.roles;
                            let add = roleme[i].add;
                            let del = roleme[i].remove;
                            for (let ii = 0; ii < add.length; ii++) {
                                if (roleList.indexOf(add[ii]) == -1) roleList.push(add[ii]);
                            }
                            for (let ii = 0; ii < del.length; ii++) {
                                if (roleList.indexOf(del[ii]) > -1) roleList.splice(roleList.indexOf(del[ii]), 1);
                            }
                            try {
                                await msg.member.edit({
                                    roles: roleList
                                });
                                bu.send(msg, 'Your roles have been edited!');
                            } catch (err) {
                                bu.send(msg, 'A roleme was triggered, but I don\'t have the permissions required to give you your role!');
                            }
                        }
                    }
                }
            }
            let prefix;
            if (!isDm)
                prefix = storedGuild.settings.prefix;
            else {
                prefix = '';
            }

            if (msg.content.toLowerCase().startsWith('blargbot')) {
                var index = msg.content.toLowerCase().indexOf('t');
                prefix = msg.content.substring(0, index + 1);
            } else if (msg.content.toLowerCase().startsWith(config.discord.defaultPrefix)) {
                prefix = config.discord.defaultPrefix;
            }

            let blacklisted;
            if (!isDm && storedGuild.channels[msg.channel.id]) blacklisted = storedGuild.channels[msg.channel.id].blacklisted;

            if (blacklisted &&
                msg.content.replace(prefix, '').split(' ')[0].toLowerCase() != 'blacklist') {
                return;
            }

            if (msg.content.indexOf('(╯°□°）╯︵ ┻━┻') > -1 && !msg.author.bot) {
                flipTables(msg, false);
            }
            if (msg.content.indexOf('┬─┬﻿ ノ( ゜-゜ノ)') > -1 && !msg.author.bot) {
                flipTables(msg, true);
            }
            var doCleverbot = false;
            if (msg.content.startsWith(`<@${bot.user.id}>`) || msg.content.startsWith(`<@!${bot.user.id}>`)) {
                prefix = msg.content.match(/<@!?[0-9]{17,21}>/)[0];
                logger.debug('Was a mention');
                doCleverbot = true;
            }
            if (msg.content.startsWith(prefix)) {
                var command = msg.content.replace(prefix, '').trim();
                logger.command('Incoming Command:', `${prefix} ${command}`);
                try {
                    let wasCommand = await handleDiscordCommand(msg.channel, msg.author, command, msg);
                    logger.command('Was command:', wasCommand);
                    if (wasCommand) {
                        bu.send('243229905360388106', {
                            embed: {
                                description: msg.content,
                                fields: [{
                                    name: msg.guild.name,
                                    value: msg.guild.id,
                                    inline: true
                                }, {
                                    name: msg.channel.name,
                                    value: msg.channel.id,
                                    inline: true
                                }],
                                author: {
                                    name: `${bu.getFullName(msg.author)} (${msg.author.id})`,
                                    icon_url: msg.author.avatarURL
                                },
                                timestamp: moment(msg.timestamp),
                                footer: {
                                    text: `MsgID: ${msg.id}`
                                }
                            }
                        });
                        if (!isDm) {
                            let deletenotif = storedGuild.settings.deletenotif;
                            if (deletenotif != '0') {
                                if (!commandMessages[msg.channel.guild.id]) {
                                    commandMessages[msg.channel.guild.id] = [];
                                }
                                commandMessages[msg.channel.guild.id].push(msg.id);
                                if (commandMessages[msg.channel.guild.id].length > 100) {
                                    commandMessages[msg.channel.guild.id].shift();
                                }
                            }
                            if (msg.channel.guild) {
                                r.table('user').get(msg.author.id).update({
                                    lastcommand: msg.cleanContent,
                                    lastcommanddate: r.epochTime(moment() / 1000)
                                }).run();
                            }
                        }
                    } else {
                        if (doCleverbot && !msg.author.bot) {
                            Cleverbot.prepare(function() {
                                var username = msg.channel.guild.members.get(bot.user.id).nick ?
                                    msg.channel.guild.members.get(bot.user.id).nick :
                                    bot.user.username;
                                var msgToSend = msg.cleanContent.replace(new RegExp('@' + username + ',?'), '').trim();
                                logger.debug(msgToSend);
                                bu.cleverbotStats++;
                                cleverbot.write(msgToSend, function(response) {
                                    bot.sendChannelTyping(msg.channel.id);
                                    setTimeout(function() {
                                        bu.send(msg, response.message);
                                    }, 1500);
                                });
                            });
                        } else {
                            if (bu.awaitMessages.hasOwnProperty(msg.channel.id) &&
                                bu.awaitMessages[msg.channel.id].hasOwnProperty(msg.author.id)) {
                                let firstTime = bu.awaitMessages[msg.channel.id][msg.author.id].time;
                                if (moment.duration(moment() - firstTime).asMinutes() <= 5) {
                                    bu.emitter.emit(bu.awaitMessages[msg.channel.id][msg.author.id].event, msg);
                                }
                            }
                        }
                    }
                } catch (err) {
                    logger.error(err.stack);
                }
            } else {

                if (bu.awaitMessages.hasOwnProperty(msg.channel.id) &&
                    bu.awaitMessages[msg.channel.id].hasOwnProperty(msg.author.id)) {
                    let firstTime = bu.awaitMessages[msg.channel.id][msg.author.id].time;
                    if (moment.duration(moment() - firstTime).asMinutes() <= 5) {
                        bu.emitter.emit(bu.awaitMessages[msg.channel.id][msg.author.id].event, msg);
                    }
                }
                if (msg.author.id == bu.CAT_ID && msg.content.indexOf('discord.gg') == -1) {
                    var prefixes = ['!', '@', '#', '$', '%', '^', '&', '*', ')', '-', '_', '=', '+', '}', ']', '|', ';', ':', '\'', '>', '?', '/', '.', '"'];
                    if (!msg.content ||
                        (prefixes.indexOf(msg.content.substring(0, 1)) == -1) &&
                        !msg.content.startsWith('k!') &&
                        !msg.content.startsWith('b!') &&
                        msg.channel.guild) {
                        let last = await r.table('catchat').orderBy({
                            index: r.desc('id')
                        }).nth(1).run();
                        if ((last && last.content != msg.content) || msg.content == '') {
                            var content = msg.content;
                            try {
                                while (/<@!?[0-9]{17,21}>/.test(content)) {
                                    content = content.replace(/<@!?[0-9]{17,21}>/, '@' + (await bu.getUser(msg, content.match(/<@!?([0-9]{17,21})>/)[1], true)).username);
                                }
                            } catch (err) {
                                logger.error(err.stack);
                            }
                            let nsfw = true;
                            if (!isDm && storedGuild.channels[msg.channel.id]) nsfw = storedGuild.channels[msg.channel.id].nsfw;
                            r.table('catchat').insert({
                                content: msg.content,
                                attachment: msg.attachments[0] ? msg.attachments[0].url : null,
                                userid: msg.author.id,
                                msgid: msg.id,
                                channelid: msg.channel.id,
                                guildid: isDm ? 'DM' : msg.channel.guild.id,
                                msgtime: r.epochTime(moment(msg.timestamp) / 1000),
                                nsfw: nsfw,
                                mentions: msg.mentions.map(u => u.username).join(','),
                            }).run();
                        }
                    }
                }
            }
        }
        if (msg.channel.id != '204404225914961920') {
            let nsfw = true;
            if (!isDm && storedGuild.channels[msg.channel.id]) nsfw = storedGuild.channels[msg.channel.id].nsfw;
            r.table('chatlogs').insert({
                content: msg.content,
                attachment: msg.attachments[0] ? msg.attachments[0].url : null,
                userid: msg.author.id,
                msgid: msg.id,
                channelid: msg.channel.id,
                guildid: isDm ? 'DM' : msg.channel.guild.id,
                msgtime: r.epochTime(moment(msg.timestamp) / 1000),
                type: 0
            }).run();
        }
    });
}

function initEvents() {
    logger.init('Starting event interval!');
    eventTimer = setInterval(async function() {
        let events = await r.table('events').between(r.epochTime(0), r.now(), {
            index: 'endtime'
        });
        for (let event of events) {
            let type = event.type;
            bu.commands[type].event(event);
            r.table('events').get(event.id).delete().run();
        }
    }, 10000);
}
var changefeed;

async function registerChangefeed() {
    try {
        logger.info('Registering a changefeed!');
        changefeed = await r.table('guild').changes({
            squash: true
        }).run((err, cursor) => {
            if (err) logger.error(err);
            //logger.debug(cursor);
            cursor.on('error', err => {
                logger.error(err);
            });
            cursor.on('data', data => {
                // logger.debug(data);
                if (data.new_val)
                    bu.guildCache[data.new_val.guildid] = data.new_val;
                else delete bu.guildCache[data.old_val.guildid];
            });
            /*
            cursor.each(guild => {
                logger.debug(guild);
                try {
                    bu.guildCache[guild.guildid] = guild;
                } catch (err) {
                    logger.error(err);
                }
            });
            */
        });
        changefeed.on('end', registerChangefeed);
    } catch (err) {
        logger.warn(`Failed to register a changefeed, will try again in 10 seconds.`);
        setTimeout(registerChangefeed, 10000);
    }
}