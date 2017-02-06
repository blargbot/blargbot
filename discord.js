const fs = require('fs');
const util = require('util');
const Eris = require('eris');
Object.defineProperty(Eris.Message, "guild", {
    get: function guild() {
        return this.channel.guild;
    }
});
const moment = require('moment-timezone');
const path = require('path');
const https = require('https');
global.tags = require('./tags.js');
const reload = require('require-reload')(require);
const request = require('request');
const Promise = require('promise');
//const webInterface = require('./interface.js');
var bot;
const website = require('./backend/main');


var e = module.exports = {},
    vars, emitter, bot, VERSION;

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
            delete bu.commands[commandName];
        }
    } catch (err) {
        logger.error(err);
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


/**
 * Initializes the bot
 * @param v - the version number (String)
 * @param topConfig - the config file (Object)
 * @param em - the event emitter (EventEmitter)
 */
e.init = async function(v, em) {
    bu.commandMessages = {};

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
            TYPING_START: true
        },
        getAllUsers: true,
        maxShards: config.discord.shards || 1,
        restMode: true
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

    bu.avatars = JSON.parse(fs.readFileSync(path.join(__dirname, `avatars${config.general.isbeta ? '' : 2}.json`), 'utf8'));

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
        //     logger.debug(toEval);
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



var startTime = moment();


/*
function reloadInterface() {
    webInterface.kill();
    webInterface = reload('./interface.js');
    webInterface.init(bot, bu);
}
*/
function registerListeners() {

}

function filterUrls(input) {
    return input.replace(/https?\:\/\/.+\.[a-z]{1,20}(\/[^\s]*)?/gi, '');
}


var changefeed;

async function registerChangefeed() {
    registerSubChangefeed('guild', 'guildid', bu.guildCache);
    registerSubChangefeed('user', 'userid', bu.userCache);
    registerSubChangefeed('tag', 'name', bu.tagCache);
    registerGlobalChangefeed();
}

async function registerGlobalChangefeed() {
    try {
        logger.info('Registering a global changefeed!');
        changefeed = await r.table('vars').changes({
            squash: true
        }).run((err, cursor) => {
            if (err) logger.error(err);
            cursor.on('error', err => {
                logger.error(err);
            });
            cursor.on('data', data => {
                if (data.new_val && data.new_val.varname == 'tagVars')
                    bu.globalVars = data.new_val.values;
            });
        });
        changefeed.on('end', registerChangefeed);
    } catch (err) {
        logger.warn(`Failed to register a global changefeed, will try again in 10 seconds.`);
        setTimeout(registerChangefeed, 10000);
    }
}

async function registerSubChangefeed(type, idName, cache) {
    try {
        logger.info('Registering a ' + type + ' changefeed!');
        changefeed = await r.table(type).changes({
            squash: true
        }).run((err, cursor) => {
            if (err) logger.error(err);
            cursor.on('error', err => {
                logger.error(err);
            });
            cursor.on('data', data => {
                if (data.new_val)
                    cache[data.new_val[idName]] = data.new_val;
                else delete cache[data.old_val[idName]];
            });
        });
        changefeed.on('end', registerChangefeed);
    } catch (err) {
        logger.warn(`Failed to register a ${type} changefeed, will try again in 10 seconds.`);
        setTimeout(registerChangefeed, 10000);
    }
}



// Now look at this net,
// that I just found!
async function net() {
    // When I say go, be ready to throw!

    // GO!
    throw net;
}
// Urgh, let's try something else!