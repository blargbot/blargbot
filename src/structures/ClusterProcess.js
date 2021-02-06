const { Sender } = require('./Sender');
const childProcess = require('child_process');

class ClusterProcess extends Sender {
    constructor(id, manager, file) {
        let firstShard = Math.min(manager.max - 1, manager.shardsPerCluster * id);
        let lastShard = Math.min(manager.max - 1, (manager.shardsPerCluster * id) + manager.shardsPerCluster - 1);
        let shardCount = lastShard - firstShard + 1;

        const env = Object.assign({}, process.env, manager.env, {
            CLUSTER_ID: id,
            SHARDS_MAX: manager.max,
            SHARDS_FIRST: firstShard,
            SHARDS_LAST: lastShard,
            SHARDS_COUNT: shardCount
        });

        let execArgv = process.execArgv.filter(a => {
            return !/debug-brk/.test(a);
        });
        execArgv.push('--max-old-space-size=4096'); // 4GB max ram
        // execArgv.push('--prof'); // node-tick profiling

        const child = childProcess.fork(file || manager.file, process.argv, { env: env, execArgv });

        super(id, child, console);
        this.id = id;
        this.manager = manager;
        this.file = file || this.manager.file;
        this.respawn = true;
        this.env = env;


        this.process.on('message', message => {
            const { type, id, data } = message;
            if (type === undefined)
                return;
            if (type.startsWith('await:')) {
                this.emit(type, data);
            } else
                this.manager.handleMessage(this, type, message.data);
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