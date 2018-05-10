/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:31:12
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-09 19:35:29
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */
global.Promise = require('bluebird');
global.config = require('../../config.json');
const Logger = require('./logger');
new Logger(process.env.SHARD_ID, config.general.isbeta ? 'module' : 'info').setGlobal();

global.dep = require('./dep.js');

const https = dep.https;
global.bbtag = require('./bbtag.js');
const Sender = require('../structures/Sender');

process.on('unhandledRejection', (err, p) => {
    console.error('Unhandled Promise Rejection: Promise', err);
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
        global.TagManager = new Manager('tags', undefined, false);
        TagManager.init();
        let tags = Object.keys(TagManager.list).map(k => TagManager.list[k].category);
        console.info('Tags: ' + tags.length +
            ' | Simple: ' + tags.filter(t => t == bu.TagType.SIMPLE).length +
            ' | Complex: ' + tags.filter(t => t == bu.TagType.COMPLEX).length +
            ' | Array: ' + tags.filter(t => t == bu.TagType.ARRAY).length +
            ' | CCommand: ' + tags.filter(t => t == bu.TagType.CCOMMAND).length);

        const CommandManagerClass = require('./CommandManager.js');
        global.CommandManager = new CommandManagerClass();

        //website.init();

        this.sender = new Sender(this, process);

        console.init('Connecting...');
        this.connect();
    }

    async eval(msg, text, send = true) {
        if (msg.author.id === bu.CAT_ID) {
            let resultString, result;
            var commandToProcess = text.replace('eval ', '');
            if (commandToProcess.startsWith('```js') && commandToProcess.endsWith('```'))
                commandToProcess = commandToProcess.substring(6, commandToProcess.length - 3);
            else if (commandToProcess.startsWith('```') && commandToProcess.endsWith('```'))
                commandToProcess = commandToProcess.substring(4, commandToProcess.length - 3);
            try {
                let func;
                if (commandToProcess.split('\n').length === 1) {
                    func = eval(`async () => ${commandToProcess}`);
                } else {
                    func = eval(`async () => { ${commandToProcess} }`);
                }
                func.bind(this);
                let res = await func();
                result = res;
                resultString = `Input:
\`\`\`js
${commandToProcess}
\`\`\`
Output:
\`\`\`js
${res}
\`\`\``;
            } catch (err) {
                result = err;
                resultString = `An error occured!
\`\`\`js
${err.stack}
\`\`\``;
            }
            if (send)
                bu.send(msg, resultString);
            else return { resultString, result };
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
                case 'eval': {
                    let result = await discord.eval({ author: { id: bu.CAT_ID } }, data.code, false);
                    bot.sender.send(eventKey, { result: result.result, shard: parseInt(process.env.SHARD_ID) });
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
                                exampleCode: t.exampleCode,
                                exampleIn: t.exampleIn,
                                exampleOut: t.exampleOut,
                                deprecated: t.deprecated,
                                returns: t.returns,
                                errors: t.errors,
                                staff: t.staff,
                                aliases: t.aliases
                            };
                        }
                    }
                    bot.sender.send(eventKey, JSON.stringify(tags));
                    break;
                }
                case 'commandList': {
                    let commands = {};
                    let ls = CommandManager.built;
                    for (const key in ls) {
                        let c = ls[key];
                        if (c.isCommand && !c.hidden) {
                            commands[key] = {
                                usage: c.usage,
                                info: c.info,
                                longinfo: c.longinfo,
                                category: c.category,
                                alias: c.alias,
                                flags: c.flags,
                                onlyOn: c.onlyOn
                            };
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

const usage = require('usage');
function getCPU() {
    return new Promise((res, rej) => {
        let pid = process.pid;
        usage.lookup(pid, { keepHistory: true }, function (err, result) {
            if (err) res('NaN')
            else res(result.cpu);
        })
    });
}
// shard status posting
let shardStatusInterval = setInterval(async () => {
    let shard = bot.shards.get(parseInt(process.env.SHARD_ID));
    let mem = process.memoryUsage();
    bot.sender.send('shardStats', {
        id: process.env.SHARD_ID,
        time: Date.now(),
        readyTime: bot.startTime,
        guilds: bot.guilds.size,
        rss: mem.rss,
        cpu: await getCPU(),
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
