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
            this.handleMessage(message.code, message.data);
        });

    }
    kill(code) {
        this.respawn = false;
        this.process.kill(code);
    }

    async handleMessage(code, data) {
        console.log(code, data);
        if (code.startsWith('await:')) {
            this.emit(code, data);
        }
        switch (code) {
            case 'await':
                const eventKey = 'await:' + data.key;
                switch (data.message) {
                    case 'tagList':
                        let shard = this.client.spawner.shards.get(0);
                        let res = await shard.awaitMessage('tagList');
                        this.send(eventKey, res);
                        break;
                    default:
                        this.send(eventKey, { code: 404, mes: 'not found' });
                }
                break;
        }
    }
}

module.exports = Frontend;