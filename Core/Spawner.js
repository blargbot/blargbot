const { Shard } = require('./Structures');
const EventEmitter = require('eventemitter3');

class Spawner extends EventEmitter {
    constructor(options = {}) {
        super();
        this.max = options.max || 1;
        this.token = _config.discord.token;
        this.file = options.file || 'Core/DiscordClient.js';
        this.respawn = options.respawn || true;
        this.shards = new Map();
        this.guildShardMap = {};
    }

    spawn(id) {
        return new Promise((resolve, reject) => {
            const shard = new Shard(id, this);
            if (this.shards.get(id) !== undefined)
                this.shards.delete(id);
            this.shards.set(id, shard);
            this.once('threadReady' + id, () => {

                resolve(shard);
            });
        });
    }

    async spawnAll() {
        let spawned = [];
        for (let i = 0; i < this.max; i++) {
            spawned.push(await this.spawn(i));
        }
        return spawned;
    }

    broadcast(code, data) {
        for (const [id, shard] of this.shards) {
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
                i++;
                shard.awaitMessage(data).then(received => {
                    onComplete(received);
                }).catch(reject);
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
                    default:
                        await shard.send(eventKey, 'Unknown await key: ' + data.message);
                        break;
                }
                break;
            case 'threadReady':
                this.emit('threadReady' + data.message);
                break;
            case 'ready':
                for (const guild in this.guildShardMap)
                    if (this.guildShardMap[guild] === shard.id) delete this.guildShardMap[guild];
                for (const guild of data)
                    this.guildShardMap[guild] = shard.id;
                break;
            case 'guildCreate':
                this.guildShardMap[data] = shard.js;
                break;
            case 'guildDelete':
                delete this.guildShardMap[data];
                break;
        }
    }

    handleDeath(shard, code) {
        if (this.respawn) this.spawn(shard.id);
    }
}

module.exports = Spawner;