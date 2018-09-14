const EventEmitter = require('eventemitter3');

class Sender extends EventEmitter {
    constructor(client, proc) {
        super();
        this.client = client;
        this.process = proc || process;
    }

    send(code, data) {
        if (!data) {
            data = code;
            code = 'generic';
        }
        if (!(data instanceof Object))
            data = {
                message: data,
                shard: parseInt(process.env.CLUSTER_ID)
            };
        const message = {
            code, data
        };
        return new Promise((fulfill, reject) => {
            const didSend = this.process.send(JSON.stringify(message), err => {
                if (!err) fulfill();
                else reject(err);
            });
            if (message.code !== 'log' && !didSend) {
                console.error('Shard failed to send message.\n  Connected: ' + this.process.connected + '\n  Code: ' + message.code);
                if (!this.process.connected) process.exit();
                reject(Error('Shard failed to send message'));
            }
        });
    }

    awaitMessage(data) {
        if (!(data instanceof Object))
            data = {
                message: data
            };
        return new Promise((fulfill, reject) => {
            data.key = Date.now().toString();
            let event = 'await:' + data.key;
            this.send('await', data);
            let timer = setTimeout(() => {
                this.process.removeAllListeners(event);
                reject(new Error('Rejected message after 60 seconds'));
            }, 60000);
            this.once(event, data => {
                clearTimeout(timer);
                fulfill(data);
            });
        });
    }
}

module.exports = Sender;