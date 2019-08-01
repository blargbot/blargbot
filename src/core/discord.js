/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:31:12
 * @Last Modified by: stupid cat
 * @Last Modified time: 2019-07-29 18:02:34
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */
global.Promise = require('bluebird');
global.config = require('../../config.json');
const CatLoggr = require('cat-loggr');
const moment = require('moment-timezone');
const path = require('path');
const fs = require('fs');
const { Client } = require('eris');
const Database = require('./Database');
const seqErrors = require('sequelize/lib/errors');
const { CronJob } = require('cron');
const bbEngine = require('../structures/bbtag/Engine');

const loggr = new CatLoggr({
    shardId: process.env.CLUSTER_ID,
    level: config.general.isbeta ? 'debug' : 'info',
    levels: [
        { name: 'fatal', color: CatLoggr._chalk.red.bgBlack, err: true },
        { name: 'error', color: CatLoggr._chalk.black.bgRed, err: true },
        { name: 'warn', color: CatLoggr._chalk.black.bgYellow, err: true },
        { name: 'trace', color: CatLoggr._chalk.green.bgBlack, trace: true },
        { name: 'website', color: CatLoggr._chalk.black.bgCyan },
        { name: 'ws', color: CatLoggr._chalk.yellow.bgBlack },
        { name: 'cluster', color: CatLoggr._chalk.black.bgMagenta },
        { name: 'worker', color: CatLoggr._chalk.black.bgMagenta },
        { name: 'command', color: CatLoggr._chalk.black.bgBlue },
        { name: 'irc', color: CatLoggr._chalk.yellow.bgBlack },
        { name: 'shardi', color: CatLoggr._chalk.blue.bgYellow },
        { name: 'init', color: CatLoggr._chalk.black.bgBlue },
        { name: 'info', color: CatLoggr._chalk.black.bgGreen },
        { name: 'output', color: CatLoggr._chalk.black.bgMagenta },
        { name: 'bbtag', color: CatLoggr._chalk.black.bgGreen },
        { name: 'verbose', color: CatLoggr._chalk.black.bgCyan },
        { name: 'adebug', color: CatLoggr._chalk.cyan.bgBlack },
        { name: 'debug', color: CatLoggr._chalk.magenta.bgBlack, aliases: ['log', 'dir'] },
        { name: 'database', color: CatLoggr._chalk.black.bgBlue },
        { name: 'module', color: CatLoggr._chalk.black.bgBlue }
    ]
}).setGlobal();

loggr.addArgHook(({ arg }) => {
    if (arg instanceof seqErrors.BaseError && Array.isArray(arg.errors)) {
        let text = [arg.stack];
        for (const err of arg.errors) {
            text.push(`\n - ${err.message}\n   - ${err.path} ${err.validatorKey} ${err.value}`);
        }
        return text;
    } else return null;
});

const https = require('https');
global.bbtag = require('./bbtag.js');
const Sender = require('../structures/Sender');

process.on('unhandledRejection', (err, p) => {
    console.error('Unhandled Promise Rejection: Promise', err);
});

/** CONFIG STUFF **/
global.bu = require('./util.js');

class DiscordClient extends Client {
    constructor() {
        super(config.discord.token, {
            autoReconnect: true,
            disableEveryone: true,
            getAllUsers: true,
            disableEvents: {
                TYPING_START: true,
                VOICE_STATE_UPDATE: true
            },
            maxShards: parseInt(process.env.SHARDS_MAX),
            firstShardID: parseInt(process.env.SHARDS_FIRST),
            lastShardID: parseInt(process.env.SHARDS_LAST),
            restMode: true,
            defaultImageFormat: 'png',
            defaultImageSize: 512,
            messageLimit: 0
        });
        global.bot = this;
        bu.commandMessages = {};
        bu.notCommandMessages = {};

        this.sender = new Sender(this, process);
        console.debug('HELLOOOOO?');
        this.models = {};
        this.database = new Database(this);
        this.database.authenticate();


        bu.init();
        bu.startTime = startTime;

        const Manager = require('./Manager.js');
        global.EventManager = new Manager('events', true);
        global.TagManager = new Manager('tags', undefined, false);
        TagManager.init();
        let tags = Object.keys(TagManager.list).map(k => TagManager.list[k].category);
        console.info('Tags: ' + tags.length +
            ' | Simple: ' + tags.filter(t => t == bu.TagType.SIMPLE).length +
            ' | Complex: ' + tags.filter(t => t == bu.TagType.COMPLEX).length +
            ' | Array: ' + tags.filter(t => t == bu.TagType.ARRAY).length +
            ' | CCommand: ' + tags.filter(t => t == bu.TagType.BOT).length);

        const CommandManagerClass = require('./CommandManager.js');
        global.CommandManager = new CommandManagerClass();

        //website.init();


        console.init('Connecting...');
        this.connect();

        console.addPostHook(({ text, level, timestamp }) => {
            this.sender.send('log', {
                text, level, timestamp
            }).catch(err => {
                // failed to send message to master
            });
        });

        if (process.env.CLUSTER_ID == 0) {
            bu.avatars = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'res', `avatars${config.general.isbeta ? '2' : ''}.json`), 'utf8'));
            this.avatarTask = new CronJob('*/15 * * * *', this.avatarInterval.bind(this));
            this.avatarTask.start();
        }
        this.intervalTask = new CronJob('*/15 * * * *', this.autoresponseInterval.bind(this));
        this.nonce = (Math.floor(Math.random() * 0xffffffff)).toString('16').padStart(8, '0').toUpperCase();

        this.intervalTask.start();
    }

    async avatarInterval() {
        if (config.general.isbeta) return;
        let time = moment();
        let h = parseInt(time.format('H'));
        // account for any number of possible avatars
        let m = Math.floor((parseInt(time.format('m')) / 15));
        let c = (h * 4) + m;
        let id = c % bu.avatars.length;
        await this.editSelf({
            avatar: bu.avatars[id]
        });
        await this.editGuild('194232473931087872', {
            icon: bu.avatars[id]
        });
        await this.createMessage('492698595447930881', 'Switched avatar to #' + id);
    }

    async autoresponseInterval() {
        let nonce = (Math.floor(Math.random() * 0xffffffff)).toString('16').padStart(8, '0').toUpperCase();
        let timestamp = moment().format('HH:mm:ss');

        let guilds = await r.table('guild').getAll(true, { index: 'interval' });
        guilds = guilds.filter(g => this.guilds.get(g.guildid));
        console.info('[%s] Running intervals on %i guilds', nonce, guilds.length);

        let count = 0;
        let failures = 0;
        for (const guild of guilds) {
            if (process.env.CLUSTER_ID == 2) {
                console.info('[%s] Performing interval on %s', nonce, guild.guildid);
            }
            let interval = guild.ccommands._interval;

            try {
                let g = this.guilds.get(guild.guildid);
                let id = interval.authorizer || interval.author;
                let m = g.members.get(id);
                if (!m) {
                    // member does not exist, skip execution
                    // TODO: some sort of notification that the authorizer is no longer around
                    continue;
                }
                let u = this.users.get(id);
                if (!u) u = await this.getRESTUser(id);
                let c;
                for (const channel of g.channels.values()) {
                    if (channel.type === 0) { c = channel; break; }
                }
                await bbEngine.runTag({
                    msg: {
                        channel: c,
                        author: u,
                        member: m,
                        guild: g
                    },
                    limits: new bbtag.limits.autoresponse_everything(),
                    tagContent: interval.content,
                    input: '',
                    isCC: true,
                    tagName: '_interval',
                    author: interval.author,
                    authorizer: interval.authorizer,
                    silent: true
                });
                count++;
            } catch (err) {
                console.error('Issue with interval:', guild.guildid, err);
                failures++;
            }
        }

        console.info('[%s] Intervals complete. %i success | %i fail', nonce, count, failures);
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

var startTime = moment();

function filterUrls(input) {
    return input.replace(/https?\:\/\/.+\.[a-z]{1,20}(\/[^\s]*)?/gi, '');
}

var discord = new DiscordClient();
discord.sender.send('threadReady', process.env.CLUSTER_ID);

process.on('message', async msg => {
    const { data, code } = JSON.parse(msg);

    if (code.startsWith('await:')) {
        bot.sender.emit(code, data);
    }

    switch (code) {
        case 'await':
            const eventKey = 'await:' + data.key;
            switch (data.message) {
                case 'metrics': {
                    bu.Metrics.userGauge.set(bot.users.size);
                    bot.sender.send(eventKey, JSON.stringify(bu.Metrics.aggregated.getMetricsAsJSON()));
                    break;
                }
                case 'lookupChannel': {
                    let chan = bot.getChannel(data.id);
                    if (chan) {
                        bot.sender.send(eventKey, JSON.stringify({ channel: chan.name, guild: chan.guild.name }));
                    } else bot.sender.send(eventKey, "null");
                    break;
                }
                case 'eval': {
                    let result = await discord.eval({ author: { id: bu.CAT_ID } }, data.code, false);
                    bot.sender.send(eventKey, { result: result.result, shard: parseInt(process.env.CLUSTER_ID) });
                    break;
                }
                case 'retrieveUser':
                    bot.sender.send(eventKey, { user: bot.users.get(data.id) });
                    break;
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
                                key,
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
                                key,
                                name: c.name,
                                usage: c.usage,
                                info: c.info,
                                longinfo: c.longinfo,
                                category: c.category,
                                aliases: c.aliases,
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
        case 'killShard':
            let { id } = data;
            console.shardi('Killing shard', id, 'without a reconnect.');
            let shard = bot.shards.find(s => s.id === id);
            if (shard)
                shard.disconnect({
                    reconnect: false
                });
    }
});

const usage = require('usage');
function getCPU() {
    return new Promise((res, rej) => {
        let pid = process.pid;
        usage.lookup(pid, { keepHistory: true }, function (err, result) {
            if (err) res('NaN');
            else res(result.cpu);
        });
    });
}
// shard status posting
let shardStatusInterval = setInterval(async () => {
    let mem = process.memoryUsage();
    let clusterId = parseInt(process.env.CLUSTER_ID);
    bot.sender.send('shardStats', {
        id: clusterId,
        time: Date.now(),
        readyTime: bot.startTime,
        guilds: bot.guilds.size,
        rss: mem.rss,
        cpu: await getCPU(),
        shardCount: parseInt(process.env.SHARDS_COUNT),
        shards: bot.shards.map(s => ({
            id: s.id,
            status: s.status,
            latency: s.latency,
            guilds: bot.guilds.filter(g => g.shard.id === s.id).length,
            cluster: clusterId,
            time: Date.now()
        }))
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
