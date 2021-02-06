import { Snowflake } from "catflake";
import { snowflake } from "../newbu";

export abstract class BaseWorker {
    #process: NodeJS.WorkerProcess

    public get id() { return this.#process.pid; }
    public get env() { return this.#process.env; }
    public get memoryUsage() { return this.#process.memoryUsage(); }

    constructor(
        public readonly logger: CatLogger
    ) {
        if (!isWorkerProcess(process))
            throw new Error('Worker processes must be able to send messages to their parents');

        this.#process = process;

        this.#process.on('unhandledRejection', (err, p) =>
            this.logger.error('Unhandled Promise Rejection: Promise' + JSON.stringify(err)));

        this.logger.addPostHook(({ text, level, timestamp }) => {
            this.send('log', snowflake.create(), { text, level, timestamp });
            return null
        });

        this.send('alive', snowflake.create(), 'Hello!');
    }

    send(type: string, id: Snowflake, data: JToken) {
        this.#process.send({ type, id, data });
    }

    start() {
        this.#process.on('message', ({ type, id, data }) =>
            this.handle(type, id, data))
    }

    abstract handle(type: string, id: Snowflake, data: JToken): void;
}

function isWorkerProcess(process: NodeJS.Process): process is NodeJS.WorkerProcess {
    return typeof process.send === 'function';
}