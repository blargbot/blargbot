const Sender = require('./Sender');
const childProcess = require('child_process');

class ClusterProcess extends Sender {
    constructor(id, manager, file) {
        super();
        this.id = id;
        this.manager = manager;
        this.file = file || this.manager.file;
        this.respawn = true;

        let firstShard = Math.min(this.manager.max - 1, this.manager.shardsPerCluster * this.id);
        let lastShard = Math.min(this.manager.max - 1,
            (this.manager.shardsPerCluster * this.id) + this.manager.shardsPerCluster - 1);
        let shardCount = lastShard - firstShard + 1;
        this.env = Object.assign({}, process.env, this.manager.env, {
            CLUSTER_ID: this.id,
            SHARDS_MAX: this.manager.max,
            SHARDS_FIRST: firstShard,
            SHARDS_LAST: lastShard,
            SHARDS_COUNT: shardCount
        });

        let execArgv = process.execArgv.filter(a => {
            return !/debug-brk/.test(a);
        });
        execArgv.push('--max-old-space-size=4096'); // 4GB max ram
        // execArgv.push('--prof'); // node-tick profiling

        this.process = childProcess.fork(this.file, process.argv, {
            env: this.env,
            execArgv
        });

        this.process.on('message', msg => {
            const message = JSON.parse(msg);
            if (message.code.startsWith('await:')) {
                this.emit(message.code, message.data);
            } else
                this.manager.handleMessage(this, message.code, message.data);
        });
        this.process.on('error', err => {
            console.error(this.id, err);
        });
        this.process.once('disconnect', () => {
            if (this.respawn) {
                console.warn('The shard disconnected, respawning');
                this.manager.respawnShard(this.id, true);
            }
        });

        this.process.once('kill', code => {
            console.warn('The shard was killed');
            this.manager.handleDeath(this, code);
        });
    }

    kill(code = 'SIGTERM') {
        this.respawn = false;
        this.process.kill(code);
    }
}

module.exports = ClusterProcess;