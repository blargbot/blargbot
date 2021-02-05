import { EventEmitter } from 'eventemitter3';

export class Sender extends EventEmitter {
    constructor(
        public readonly clusterId: string,
        public readonly process: NodeJS.Process,
        public readonly logger: CatLogger
    ) {
        super();
        if (!('send' in this.process))
            throw new Error('process must be a worker process');
    }

    send(code: string, data?: JObject | JArray | JValue) {
        if (data === 'undefined') {
            data = code;
            code = 'generic';
        }

        if (typeof data === 'string')
            data = { message: data, shard: this.clusterId };

        const message = { code, data };

        return new Promise<void>((fulfill, reject) => {
            if (this.process.send === undefined)
                return reject(new Error('process must be a worker process'));

            this.process.send!(JSON.stringify(message), undefined, undefined, (err: any) => {
                if (!err)
                    return fulfill();

                this.logger.error(err);
                if (!this.process.connected)
                    this.process.kill();
                reject(err);
            });
        });
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