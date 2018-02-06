/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:31:12
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-31 12:57:01
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */
global.Promise = require('bluebird');
global.config = require('../../config.json');
const Logger = require('./logger');
new Logger(process.env.SHARD_ID, config.general.isbeta ? 'debug' : 'info').setGlobal();

global.dep = require('./dep.js');

const https = dep.https;
global.tags = require('./tags.js');
const Sender = require('../structures/Sender');

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

/** CONFIG STUFF **/
global.bu = require('./util.js');


class DiscordClient extends dep.Eris.Client {
    constructor() {
        super(config.discord.token, {
            autoReconnect: true,
            disableEveryone: true,
            getAllUsers: true,
            disableEvents: {
                TYPING_START: true,
                VOICE_STATE_UPDATE: true
            },
            maxShards: config.discord.shards || 1,
            firstShardID: parseInt(process.env.SHARD_ID),
            lastShardID: parseInt(process.env.SHARD_ID),
            restMode: true,
            defaultImageFormat: 'png',
            defaultImageSize: 512,
            messageLimit: 0
        });
        global.bot = this;
        bu.commandMessages = {};
        bu.notCommandMessages = {};

        console.debug('HELLOOOOO?');


        bu.init();
        bu.startTime = startTime;

        if (process.env.SHARD_ID == 0)
            bu.avatars = JSON.parse(dep.fs.readFileSync(dep.path.join(__dirname, '..', '..', 'res', `avatars${config.general.isbeta ? '2' : ''}.json`), 'utf8'));

        const Manager = require('./Manager.js');
        global.EventManager = new Manager('events', true);
        global.TagManager = new Manager('tags');

        const CommandManagerClass = require('./CommandManager.js');
        global.CommandManager = new CommandManagerClass();

        //website.init();

        this.sender = new Sender(this, process);

        console.init('Connecting...');
        this.connect();
    }

    async eval(msg, text) {
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
            //     console.debug(toEval);
            try {
                eval(toEval);
            } catch (err) {
                bu.send(msg, `An error occured!
    \`\`\`js
    ${err.stack}
    \`\`\``);
            }
        }
    }
}

var startTime = dep.moment();

function filterUrls(input) {
    return input.replace(/https?\:\/\/.+\.[a-z]{1,20}(\/[^\s]*)?/gi, '');
}

var discord = new DiscordClient();
discord.sender.send('threadReady', process.env.SHARD_ID);

process.on('message', async msg => {
    const { data, code } = JSON.parse(msg);

    if (code.startsWith('await:')) {
        bot.sender.emit(code, data);
    }

    switch (code) {
        case 'await':
            const eventKey = 'await:' + data.key;
            switch (data.message) {
                case 'lookupChannel': {
                    let chan = bot.getChannel(data.id);
                    if (chan) {
                        bot.sender.send(eventKey, JSON.stringify({ channel: chan.name, guild: chan.guild.name }));
                    } else bot.sender.send(eventKey, "null");
                    break;
                }
                case 'getStaffGuilds': {
                    let { user, guilds } = data;
                    let res = [];
                    for (const g of guilds) {
                        if (bot.guilds.get(g.id)) {
                            if (await bu.isUserStaff(user, g.id))
                                res.push(g);
                        }
                    }
                    bot.sender.send(eventKey, JSON.stringify(res));
                    break;
                }
                case 'tagList': {
                    let tags = {};
                    let ls = TagManager.list;
                    for (const key in ls) {
                        if (ls[key].isTag) {
                            let t = ls[key];
                            tags[key] = {
                                category: t.category,
                                name: t.name,
                                args: t.args,
                                usage: t.usage,
                                desc: t.desc,
                                exampleIn: t.exampleIn,
                                exampleOut: t.exampleOut
                            }
                        }
                    }
                    bot.sender.send(eventKey, JSON.stringify(tags))
                    break;
                }
                case 'commandList': {
                    let commands = {};
                    let ls = CommandManager.list;
                    for (const key in ls) {
                        let c = ls[key];
                        if (c.isCommand && !c.hidden) {
                            commands[key] = {
                                usage: c.usage,
                                info: c.info,
                                longinfo: c.longinfo,
                                category: c.category,
                                alias: c.alias,
                                flags: c.flags
                            }
                        }
                    }
                    bot.sender.send(eventKey, JSON.stringify(commands));
                    break;
                }
            }
            break;
        case 'discordMessage':
            let { message, attachment } = data;
            if (attachment)
                await bu.send(config.discord.channel, message, attachment);
            else
                await bu.send(config.discord.channel, message);
            break;
        case 'discordTopic':
            let { topic } = data;
            await bot.editChannel(config.discord.channel, {
                topic: topic
            });
            break;
    }
});

// shard status posting
let shardStatusInterval = setInterval(() => {
    let shard = bot.shards.get(parseInt(process.env.SHARD_ID));
    let mem = process.memoryUsage();
    bot.sender.send('shardStats', {
        id: process.env.SHARD_ID,
        time: Date.now(),
        readyTime: bot.startTime,
        guilds: bot.guilds.size,
        rss: mem.rss,
        status: shard.status,
        latency: shard.latency
    });
}, 10000);


// Now look at this net,
// that I just found!
async function net() {
    // When I say go, be ready to throw!

    // GO!
    throw net();
}
// Urgh, let's try something else!
