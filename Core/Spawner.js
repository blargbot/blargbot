const { Shard } = require('./Structures');
const EventEmitter = require('eventemitter3');
const moment = require('moment');
const Timer = require('./Timer');

class Spawner extends EventEmitter {
    constructor(client, options = {}) {
        super();
        this.client = client;
        this.max = options.max || 1;
        this.token = _config.discord.token;
        this.file = options.file || 'Core/DiscordClient.js';
        this.respawn = options.respawn || true;
        this.shards = new Map();
        this.guildShardMap = {};
    }

    respawnAll() {
        return Promise.all(Array.from(this.shards.values()).map(s => this.respawnShard(s.id)));
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
            await shard.awaitMessage('connect');
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
        let spawned = [await this.spawnFrontend(), await this.spawnEventTimer()];
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
                this.shards.forEach(s => {
                    s.process.kill();
                });
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