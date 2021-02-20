import { EventEmitter } from 'eventemitter3';
import { ChildProcess } from 'child_process';

export class Sender extends EventEmitter {
    public constructor(
        public readonly clusterId: string,
        public readonly process: NodeJS.Process | ChildProcess,
        public readonly logger: CatLogger
    ) {
        super();
        if (!('send' in this.process))
            throw new Error('process must be a worker process');
    }

    public async send(code: string, data?: JObject | JArray | JValue): Promise<void> {
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

    public async awaitMessage(data: JObject | string): Promise<unknown> {
        if (typeof data === 'string')
            data = { message: data };

        const jdata = data;

        try {
            return await new Promise<unknown>((fulfill, reject) => {
                jdata.key = Date.now().toString();
                const event = 'await:' + jdata.key;
                void this.send('await', jdata);
                const timer = setTimeout(() => {
                    this.process.removeAllListeners(event);
                    reject(new Error('Rejected message after 60 seconds'));
                }, 60000);
                this.once(event, data => {
                    clearTimeout(timer);
                    fulfill(data);
                });
            });
        } catch (err) {
            Error.captureStackTrace(err);
            throw err;
        }
    }
}

function sendCore(process: NodeJS.Process | ChildProcess, message: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (!('send' in process && typeof process['send'] === 'function'))
            return reject();

        if ('exit' in process) // NodeJS
            process.send(message, undefined, undefined, err => err ? reject(err) : resolve());
        else // child_process
            process.send(message, err => err ? reject(err) : resolve());
    });
}