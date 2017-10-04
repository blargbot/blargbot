/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:31:12
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-04 10:48:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const https = dep.https;
global.tags = require('./tags.js');

const Promise = require('promise');
//const webInterface = require('./interface.js');
var bot;
const website = require('./backend/main');


var e = module.exports = {},
    vars, emitter, bot, VERSION;

e.requireCtx = require;

/**
 * Initializes the bot
 * @param v - the version number (String)
 * @param topConfig - the config file (Object)
 * @param em - the event emitter (EventEmitter)
 */
e.init = async function (v, em) {
    bu.commandMessages = {};
    bu.notCommandMessages = {};

    VERSION = v;
    emitter = em;
    logger.debug('HELLOOOOO?');

    process.on('unhandledRejection', (reason, p) => {
        logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
    });
    if (dep.fs.existsSync(dep.path.join(__dirname, 'vars.json'))) {
        var varsFile = dep.fs.readFileSync(dep.path.join(__dirname, 'vars.json'), 'utf8');
        vars = JSON.parse(varsFile);
    } else {
        vars = {};
        saveVars();
    }
    bot = new dep.Eris.Client(config.discord.token, {
        autoReconnect: true,
        disableEveryone: true,
        disableEvents: {
            TYPING_START: true
        },
        getAllUsers: true,
        maxShards: config.discord.shards || 1,
        restMode: true,
        defaultImageFormat: 'png',
        defaultImageSize: 512,
        messageLimit: 1
    });
    global.bot = bot;

    bu.init();
    bu.emitter = em;
    bu.VERSION = v;
    bu.startTime = startTime;
    bu.vars = vars;

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

    emitter.on('saveVars', () => {
        saveVars();
    });

    bu.avatars = JSON.parse(dep.fs.readFileSync(dep.path.join(__dirname, `avatars${config.general.isbeta ? 'Beta' : ''}.json`), 'utf8'));
    const Manager = require('./Manager.js');
    global.EventManager = new Manager('events', true);
    global.TagManager = new Manager('tags');

    const CommandManagerClass = require('./CommandManager.js');
    global.CommandManager = new CommandManagerClass();

    website.init();

    registerChangefeed();
    logger.init('Connecting...');
    bot.connect();
};


/**
 * Reloads the misc variables object
 */
function reloadVars() {
    dep.fs.readFileSync(dep.path.join(__dirname, 'vars.json'), 'utf8', function (err, data) {
        if (err) throw err;
        vars = JSON.parse(data);
    });
}

/**
 * Saves the misc variables to a file
 */
function saveVars() {
    dep.fs.writeFileSync(dep.path.join(__dirname, 'vars.json'), JSON.stringify(vars, null, 4));
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
    else { }
}
/**
 * Function to be used with createLogs
 * @param name - file name (String)
 */
function saveLogs(name) {
    messageI = 0;
    dep.fs.writeFile(dep.path.join(__dirname, name), JSON.stringify(messageLogs, null, 4));
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

    var req = https.request(options, function (res) {
        var body = '';
        res.on('data', function (chunk) {
            logger.debug(chunk);
            body += chunk;
        });

        res.on('end', function () {
            logger.debug('body: ' + body);
            lastUserStatsKek = JSON.parse(body);
            logger.debug(lastUserStatsKek);
        });

        res.on('error', function (thing) {
            logger.warn(`Result Error: ${thing}`);
        });
    });
    req.on('error', function (err) {
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

var startTime = dep.moment();

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
