const Sender = require('./Sender');

class Shard extends Sender {
    constructor(id, manager) {
        super();
        this.id = id;
        this.manager = manager;
        
        this.env = Object.assign({}, process.env, this.manager.env, {
            SHARD_ID: this.id,
            SHARD_TOKEN: this.manager.token,
            SHARD_MAX: this.manager.max
        });

        this.process = _dep.childProcess.fork(this.manager.file, process.argv, {
            env: this.env
        });

        this.process.on('message', msg => {
            const message = JSON.parse(msg);
            if (message.code.startsWith('await:')) {
                this.process.emit(message.code, message.data);
            } else
                this.manager.handleMessage(message.code, message.data);
        });

        this.process.once('kill', code => {
            this.manager.handleDeath(this, code);
        });
    }
}

module.exports = Shard;