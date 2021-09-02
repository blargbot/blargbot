import { ProcessMessageHandler, TypeMapping, WorkerPoolEventHandler } from '@core/types';
import { WorkerConnection, WorkerPool } from '@core/worker';

import { BaseService } from './BaseService';

export abstract class WorkerPoolEventService<TWorker extends WorkerConnection<string>, TData, TReply = never> extends BaseService {
    public readonly type: string;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #attach: (worker: TWorker) => void;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #detach: (worker: TWorker) => void;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #handlers: WeakMap<TWorker, ProcessMessageHandler>;

    public constructor(
        public readonly workers: WorkerPool<TWorker>,
        public readonly event: string,
        protected readonly mapping: TypeMapping<TData>,
        protected readonly execute: WorkerPoolEventHandler<TWorker, TData, TReply>
    ) {
        super();
        this.type = `WorkerPool:Worker:${event}`;
        this.#attach = this.attach.bind(this);
        this.#detach = this.detach.bind(this);
        this.#handlers = new WeakMap();
    }

    public start(): void {
        this.workers.on('spawningworker', this.#attach);
        this.workers.on('killingworker', this.#detach);
    }

    public stop(): void {
        this.workers.off('spawningworker', this.#attach);
        this.workers.off('killingworker', this.#detach);
    }

    private attach(worker: TWorker): void {
        const handler: ProcessMessageHandler = ({ data, id, reply }) => {
            const mapped = this.mapping(data);
            if (!mapped.valid)
                return this.workers.logger.error(`${this.workers.type} worker pool event handler ${this.name} got invalid arguments`, data);

            try {
                this.execute({ worker, data: mapped.value, id, reply });
            } catch (err: unknown) {
                this.workers.logger.error(`${this.workers.type} worker pool event handler ${this.name} threw an error`, err);
            }
        };
        this.#handlers.set(worker, handler);
        worker.on(this.event, handler);
    }

    private detach(worker: TWorker): void {
        const handler = this.#handlers.get(worker);
        if (handler === undefined)
            return;
        worker.off(this.event, handler);
        this.#handlers.delete(worker);
    }
}
