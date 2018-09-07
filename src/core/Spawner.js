const Shard = require('../structures/Shard');
const EventEmitter = require('eventemitter3');
const moment = require('moment');
const Timer = require('../structures/Timer');
const stripAnsi = require('strip-ansi');

class Spawner extends EventEmitter {
    constructor(client, options = {}) {
        super();
        this.client = client;

        this.max = config.shards.max;
        this.shardsPerCluster = config.shards.perCluster;
        this.clusterCount = Math.ceil(this.max / this.shardsPerCluster);

        this.file = options.file || 'src/core/discord.js';
        this.respawn = options.respawn || true;
        this.shards = new Map();
        this.guildShardMap = {};

        this.logCache = {};

        process.on('exit', code => {
            this.killAll();
        });

        this.shardCache = {};

        this.uptimeInterval = setInterval(async () => {
            bu.Metrics.shardStatus.reset();
            for (const key of Object.keys(this.shardCache)) {
                const shard = this.shardCache[key];
                bu.Metrics.shardStatus.labels(shard.status).inc();
                let diff = moment.duration(moment() - shard.time);
                if (!shard.respawning && diff.asMilliseconds() > 60000) {
                    shard.respawning = true;
                    await this.client.discord.createMessage('398946258854871052', `Respawning unresponsive cluster ${shard.id}...\n⏰ Unresponsive for ${diff.asSeconds()} seconds`);
                    this.respawnShard(parseInt(shard.id), true);
                }
            }
        }, 10000);
        this.metricCache = {};
        this.metricsInterval = setInterval(async () => {
            await this.retrieveMetrics();
        }, 15000);

        this.domainCache = {};
        this.domainTTL = 0;
    }

    respawnAll() {
        return Promise.all(Array.from(this.shards.values()).filter(s => !isNaN(parseInt(s.id))).map(s => this.respawnShard(s.id)));
    }

    respawnShard(id, dirty = false) {
        return new Promise(async (res, rej) => {
            let logs = '';
            if (dirty) {
                logs = `\n\nLast 5 console outputs:\n\`\`\`md\n${
                    this.logCache[id].slice(0, 5).reverse().map(m => {
                        return `[${m.timestamp}][${m.level}] ${m.text}`;
                    }).join('\n')
                    }\n\`\`\` `;
            }
            let shard = await this.spawn(id, false);
            shard.on('shardReady', async (data) => {
                if (this.shards.get(id) !== undefined) {
                    let oldShard = this.shards.get(id);
                    oldShard.send('killShard', { id: data });
                }
            });
            shard.on('ready', async () => {
                if (this.shards.get(id) !== undefined) {
                    let oldShard = this.shards.get(id);
                    oldShard.kill();
                    this.shards.delete(id);
                }
                this.shards.set(id, shard);
                res();
                let output = `Cluster ${id} has been respawned.`;

                await this.client.discord.createMessage('398946258854871052', output + logs);
            });
        });
    }

    spawnFrontend() {
        return this.spawn('FE', true, 'Frontend/Website.js');
    }

    spawnEventTimer() {
        return this.spawn('ET', true, 'Core/EventTimer.js');
    }

    spawn(id, set = true, file) {
        return new Promise((resolve, reject) => {
            const shard = new Shard(id, this, file);
            if (set) {
                if (this.shards.get(id) !== undefined) {
                    this.shards.get(id).kill();
                    this.shards.delete(id);
                }
                this.shards.set(id, shard);
            }
            shard.once('threadReady', () => {
                resolve(shard);
            });
        });
    }

    async spawnAll() {
        let spawned = [];
        // let spawned = [await this.spawnFrontend(), await this.spawnEventTimer()];
        for (let i = 0; i < this.clusterCount; i++) {
            spawned.push(await this.spawn(i));
        }
        return spawned;
    }

    broadcast(code, data) {
        for (const [id, shard] of this.shards) {
            if (shard.file === this.file)
                shard.send(code, data);
        }
    }

    awaitBroadcast(data) {
        const shards = this.shards;
        return new Promise((fulfill, reject) => {
            let datum = [];
            let i = 0;
            function onComplete(received) {
                datum.push(received);
                if (datum.length >= shards.size)
                    fulfill(datum);
            }
            for (const [id, shard] of shards) {
                if (shard.file === this.file) {
                    i++;
                    shard.awaitMessage(data).then(received => {
                        onComplete(received);
                    }).catch(reject);
                }
            }
        });
    }

    // Returns the first value that fulfils the conditional callback
    // If no values fulfil the requirement, returns null
    awaitConditionalBroadcast(data, condition) {
        const shards = this.shards;
        return new Promise((fulfill, reject) => {
            let datum = [];
            let i = 0;
            function onComplete(received) {
                datum.push(received);
                if (condition(received))
                    fulfill(received);
                if (datum.length >= shards.size)
                    fulfill(null);
            }
            for (const [id, shard] of shards) {
                if (shard.file === this.file) {
                    i++;
                    shard.awaitMessage(data).then(received => {
                        onComplete(received);
                    }).catch(reject);
                }
            }
        });
    }

    async lookupChannel(id) {
        let res = await this.awaitBroadcast({ message: 'lookupChannel', id });
        return res.map(r => JSON.parse(r.message)).filter(r => r !== null)[0] || { channel: 'Unknown', guild: 'Unknown' };
    }

    async retrieveMetrics() {
        let res = await this.awaitBroadcast({ message: 'metrics' });
        res.forEach(r => this.metricCache[r.shard] = JSON.parse(r.message));
        bu.Metrics.registryCache = Object.values(this.metricCache);
    }

    async getStaffGuilds(userId, guilds) {
        let res = await this.awaitBroadcast({
            message: 'getStaffGuilds',
            user: userId, guilds
        });
        return [].concat(...res.map(g => JSON.parse(g.message)));
    }

    async recacheDomains() {
        if (moment().valueOf() - this.domainTTL >= 1000 * 60 * 15) {// recache every 15 minutes
            this.domainTTL = moment().valueOf();
            this.domainCache = (await r.table('vars').get('whitelistedDomains')).values;
        }
    }

    async handleMessage(shard, code, data) {
        switch (code) {
            case 'await':
                const eventKey = 'await:' + data.key;
                switch (data.message) {
                    case 'requestMetrics':
                        await shard.send(eventKey, { metric: JSON.stringify(this.metricCache[shard.id] || null) });
                        break;
                    case 'shardStatus':
                        let statuses = await this.awaitBroadcast('shardStatus');
                        await shard.send(eventKey, { message: statuses });
                        break;
                    case 'retrieveUser':
                        let user = await this.awaitConditionalBroadcast({ message: 'retrieveUser', id: data.id },
                            data => data.user != null);
                        if (!user) {
                            try {
                                user = await bot.getRESTUser(data.id);
                            } catch (err) { }
                        } else user = user.user;
                        await shard.send(eventKey, { user });
                        break;
                    case 'seval': {
                        let evals = await this.awaitBroadcast({ message: 'eval', code: data.code });
                        let sum = 0;
                        console.log(evals);
                        for (const val of evals)
                            if (typeof val.result === 'number')
                                sum += val.result;
                        await shard.send(eventKey, { result: sum });
                        break;
                    }
                    case 'geval': {
                        let evals = await this.awaitBroadcast({ message: 'eval', code: data.code });
                        await shard.send(eventKey, { result: evals });
                        break;
                    }
                    case 'meval': {
                        let commandToProcess = data.code;
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
                            await shard.send(eventKey, { result: res });
                        } catch (err) {
                            await shard.send(eventKey, { result: err.stack });
                        }
                        break;
                    }
                    case 'tagList': {
                        let shard0 = this.client.spawner.shards.get(0);
                        let res = await shard0.awaitMessage('tagList');
                        shard.send(eventKey, res);
                        break;
                    }
                    case 'commandList': {
                        let shard0 = this.client.spawner.shards.get(0);
                        let res = await shard0.awaitMessage('commandList');
                        shard.send(eventKey, res);
                        break;
                    }
                    case 'whitelistedDomain': {
                        this.recacheDomains();
                        shard.send(eventKey, { result: this.domainCache[data.domain] === true });
                        break;
                    }
                    default:
                        await shard.send(eventKey, 'Unknown await key: ' + data.message);
                        break;
                }
                break;
            case 'log':
                if (!this.logCache[shard.id]) this.logCache[shard.id] = [];
                data.text = stripAnsi(data.text);
                this.logCache[shard.id].unshift(data);
                if (this.logCache[shard.id].length >= 180) this.logCache[shard.id].pop();
                break;
            case 'shardStats':
                if (global.wss) {
                    wss.broadcast({ code: 'shard', data });
                    this.shardCache[data.id] = data;
                }
                break;
            case 'ircMessage':
                this.client.irc.bot.say(config.irc.channel, data.message);
                break;
            case 'eventGuild':
                console.log(data);
                break;
            case 'eventGeneric':
                console.log(data);
                break;
            case 'threadReady':
                shard.emit('threadReady');
                break;
            case 'ready':
                shard.emit('ready');
                for (const guild in this.guildShardMap)
                    if (this.guildShardMap[guild] === shard.id) delete this.guildShardMap[guild];
                for (const guild of data)
                    this.guildShardMap[guild] = shard.id;
                break;
            case 'shardReady':
                shard.emit('shardReady', data.id);
                break;
            case 'respawn': {
                console.log('Respawning a shard');
                let timer = new Timer().start();
                let sId = data.id;
                if (sId === undefined || sId === null) sId = shard.id;
                await this.respawnShard(sId);
                timer.end();
                await this.client.discord.createMessage(data.channel, `The shard has been successfully respawned! It only took me ${timer.format()}`);
                break;
            }
            case 'respawnFrontend': {
                console.log('Respawning the frontend');
                this.client.restartWebsite();
            }
            case 'respawnAll': {
                console.log('Respawning all shards');
                let timer = new Timer().start();
                await this.respawnAll();
                timer.end();
                await this.client.discord.createMessage(data.message, `I'm back! It only took me ${timer.format()}.`);
                console.log('Respawn complete.');
                break;
            }
            case 'guildCreate':
                this.guildShardMap[data] = shard.js;
                break;
            case 'guildDelete':
                delete this.guildShardMap[data];
                break;
            case 'KILLEVERYTHING':
                console.fatal('We all deserve to die. Even you, mister cat. Even I.');
                this.killAll();
                process.exit(0);
                break;
        }
    }

    handleDeath(shard, code) {
        console.log('A shard died, how sad');
        if (this.respawn && shard.respawn) this.spawn(shard.id);
    }

    killAll(code) {
        this.respawn = false;

        this.shards.forEach(s => s.kill());

        console.log('All shards have been killed.');
    }
}



module.exports = Spawner;