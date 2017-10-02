const childProcess = require('child_process');
const Sender = require('../Core/Structures/Sender');
const path = require('path');

class Frontend extends Sender {
    constructor(client) {
        super(client);
        this.respawn = true;
        this.env = Object.assign({}, process.env, {
            SHARD_ID: 'FR',
            VUE_DEV: 'true'
        });
        let execArgv = process.execArgv.filter(a => {
            return !/debug-brk/.test(a);
        });

        this.process = childProcess.fork(path.join(__dirname, 'Website.js'), process.argv, {
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

    }
    kill(code) {
        this.respawn = false;
        this.process.kill(code);
    }
}

module.exports = Frontend;