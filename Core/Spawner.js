const { Shard } = require('./Structures');

class Spawner extends _dep.EventEmitter {
    constructor(options = {}) {
        super();
        this.max = options.max || 1;
        this.token = _config.discord.token;
        this.file = options.file || 'Core/DiscordClient.js';
        this.respawn = options.respawn || true;
        this.shards = new Map();
    }

    spawn(id) {
        return new Promise((resolve, reject) => {
            const shard = new Shard(id, this);
            if (this.shards.get(id) !== undefined)
                this.shards.delete(id);
            this.shards.set(id, shard);
            this.once('threadReady' + id, () => {
                _logger.init('Resolving spawn for threadReady' + id);
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

    async handleMessage(code, data) {
        switch (code) {
            case 'shardStatus':
                let statuses = await this.awaitBroadcast('shardStatus');
                _logger.debug(statuses);
                break;
            case 'threadReady':
                _logger.init('thread is ready', data);
                this.emit('threadReady' + data.message);
                break;
        }
    }

    handleDeath(shard, code) {
        if (this.respawn) this.spawn(shard.id);
    }
}

module.exports = Spawner;