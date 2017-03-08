class Sender extends _dep.EventEmitter {
    constructor(process) {
        super();
        this.process = process || undefined;
    }
    
    send(code, data) {
        if (!data) {
            data = code;
            code = 'generic';
        }
        if (!(data instanceof Object))
            data = {
                message: data
            };
        const message = {
            code, data
        };
        return new Promise((fulfill, reject) => {
            const didSend = this.process.send(JSON.stringify(message), err => {
                if (!err) fulfill();
                else reject(err);
            });
            if (!didSend) {
                throw new Error('Shard failed to send message');
            }
        });
    }

    awaitMessage(data) {
        if (!(data instanceof Object))
            data = {
                message: data
            };
        return new Promise((fulfill, reject) => {
            data.key = _core.Helpers.Random.generateToken(14);
            let event = 'await:' + data.key;
            this.send('await', data);
            let timer = setTimeout(() => {
                this.process.removeAllListeners(event);
                reject(new Error('Rejected message after 60 seconds'));
            }, 60000);
            this.process.once(event, data => {
                clearTimeout(timer);
                fulfill(data);
            });
        });
    }

}

module.exports = Sender;