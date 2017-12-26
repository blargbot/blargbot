const Shard = require('./Shard');
const EventEmitter = require('eventemitter3');
const moment = require('moment');
const Timer = require('./Timer');

class Spawner extends EventEmitter {
    constructor(client, options = {}) {
        super();
        this.client = client;
        this.max = config.discord.shards;
        this.file = options.file || 'src/core/discord.js';
        this.respawn = options.respawn || true;
        this.shards = new Map();
        this.guildShardMap = {};

        process.on('exit', code => {
            this.killAll();
        });

        this.shardCache = {};

        this.uptimeInterval = setInterval(() => {
            for (const shard of Object.keys(this.shardCache)) {
                if (moment.duration(moment() - shard.time).asMilliseconds() > 30000) {
                    this.respawnShard(shard.id);
                }
            }
        }, 5000);
    }

    respawnAll() {
        return Promise.all(Array.from(this.shards.values()).filter(s => !isNaN(parseInt(s.id))).map(s => this.respawnShard(s.id)));
    }

    respawnShard(id) {
        return new Promise(async (res, rej) => {
            let shard = await this.spawn(id, false);
            shard.on('ready', async () => {
                if (this.shards.get(id) !== undefined) {
                    let oldShard = this.shards.get(id);
                    oldShard.kill();
                    this.shards.delete(id);
                }
                this.shards.set(id, shard);
                res();
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
        for (let i = 0; i < this.max; i++) {
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

    async lookupChannel(id) {
        let res = await this.awaitBroadcast({ message: 'lookupChannel', id });
        return res.map(r => JSON.parse(r.message)).filter(r => r !== null)[0] || { channel: 'Unknown', guild: 'Unknown' };
    }

    async getStaffGuilds(userId, guilds) {
        let res = await this.awaitBroadcast({
            message: 'getStaffGuilds',
            user: userId, guilds
        });
        return [].concat(...res.map(g => JSON.parse(g.message)));
    }

    async handleMessage(shard, code, data) {
        switch (code) {
            case 'await':
                const eventKey = 'await:' + data.key;
                switch (data.message) {
                    case 'shardStatus':
                        let statuses = await this.awaitBroadcast('shardStatus');
                        await shard.send(eventKey, { message: statuses });
                        break;
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
                    default:
                        await shard.send(eventKey, 'Unknown await key: ' + data.message);
                        break;
                }
                break;
            case 'shardStats':
                wss.broadcast({ code: 'shard', data });
                this.shardCache[data.id] = data;
                break;
            case 'ircMessage':
                this.client.irc.bot.say(config.irc.channel, data.message)
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
            case 'respawn': {
                console.log('Respawning a shard');
                let timer = new Timer().start();
                await this.respawnShard(data.id || shard.id);
                timer.end();
                await this.client.discord.createMessage(data.channel, `The shard has been successfully respawned! It only took me ${timer.format()}`);
                break;
            }
            case 'respawnFrontend': {
                console.log('Respawning the frontend');
                let timer = new Timer().start();
                let shard = this.shards.get('FE');
                await shard.kill();
                await this.spawnFrontend();
                timer.end();
                await this.client.discord.createMessage(data.message, `The frontend has been successfully respawned! It only took me ${timer.format()}`);
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