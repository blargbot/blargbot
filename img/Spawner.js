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
    }

    spawn(id) {
        const shard = new Shard(id, this);
        if (this.shards.get(id) !== undefined)
            this.shards.delete(id);
        this.shards.set(id, shard);
        return shard;
    }

    spawnAll() {
        let spawned = [];
        for (let i = 0; i < this.max; i++) {
            spawned.push(this.spawn(i));
        }
        return spawned;
    }

    broadcast(code, data) {
        for (const [id, shard] of this.shards) {
            shard.send(code, data);
        }
    }

    awaitBroadcast(data) {
        return new Promise((fulfill, reject) => {
            let datum = [];
            let i = 0;
            function onComplete(received) {
                datum.push(received);
                fulfill(datum);
            }
            for (const [id, shard] of this.shards) {
                i++;
                shard.awaitMessage(data).then(received => {
                    onComplete(received);
                }).catch(reject);
            }
        });
    }

    handleMessage(code, data) {
        switch (code) {
            // TODO
        }
    }

    handleDeath(shard, code) {
        if (this.respawn) this.spawn(shard.id);
    }
}

module.exports = Spawner;