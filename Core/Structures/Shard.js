const Sender = require('./Sender');
const childProcess = require('child_process');

class Shard extends Sender {
    constructor(id, manager, file) {
        super();
        this.id = id;
        this.manager = manager;
        this.file = file || this.manager.file;
        this.respawn = true;

        this.env = Object.assign({}, process.env, this.manager.env, {
            SHARD_ID: this.id,
            SHARD_TOKEN: this.manager.token,
            SHARD_MAX: this.manager.max
        });

        let execArgv = process.execArgv.filter(a => {
            return !/debug-brk/.test(a);
        });

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

        this.process.once('kill', code => {
            this.manager.handleDeath(this, code);
        });
    }

    kill(code) {
        this.respawn = false;
        this.process.kill(code);
    }
}

module.exports = Shard;