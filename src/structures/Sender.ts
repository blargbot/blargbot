import { EventEmitter } from 'eventemitter3';
import { ChildProcess } from 'child_process';

export class Sender extends EventEmitter {
    constructor(
        public readonly clusterId: string,
        public readonly process: NodeJS.Process | ChildProcess,
        public readonly logger: CatLogger
    ) {
        super();
        if (!('send' in this.process))
            throw new Error('process must be a worker process');
    }

    async send(code: string, data?: JObject | JArray | JValue) {
        if (data === 'undefined') {
            data = code;
            code = 'generic';
        }

        if (typeof data === 'string')
            data = { message: data, shard: this.clusterId };

        const message = { code, data };

        try {
            await sendCore(this.process, JSON.stringify(message));
        } catch (err) {
            this.logger.error(err);
            if (!this.process.connected)
                this.process.kill();
        }
    }

    awaitMessage(data: JObject | string) {
        if (typeof data === 'string')
            data = { message: data };

        const jdata = data;

        return new Promise((fulfill, reject) => {
            jdata.key = Date.now().toString();
            let event = 'await:' + jdata.key;
            this.send('await', jdata);
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

function sendCore(process: NodeJS.Process | ChildProcess, message: string) {
    return new Promise<void>((resolve, reject) => {
        if (!('send' in process && typeof process['send'] === 'function'))
            return reject();

        if ('exit' in process) // NodeJS
            process.send(message, undefined, undefined, err => err ? reject(err) : resolve());
        else // child_process
            process.send(message, err => err ? reject(err) : resolve());
    })
}