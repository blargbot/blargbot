import { GetWorkerPoolEventHandler, IPCContracts, ProcessMessageHandler, WorkerIPCContractNames } from '@core/types';
import { WorkerConnection, WorkerPool } from '@core/worker';

import { BaseService } from './BaseService';

export abstract class WorkerPoolEventService<TWorker extends WorkerConnection<string, IPCContracts>, Contract extends WorkerIPCContractNames<TWorker>> extends BaseService {
    public readonly type: string;
    /* eslint-disable @typescript-eslint/explicit-member-accessibility */
    readonly #attach: (worker: TWorker) => void;
    readonly #detach: (worker: TWorker) => void;
    readonly #handlers: WeakMap<TWorker, ProcessMessageHandler>;
    /* eslint-enable @typescript-eslint/explicit-member-accessibility */

    public constructor(
        public readonly workers: WorkerPool<TWorker>,
        public readonly contract: Contract,
        protected readonly execute: GetWorkerPoolEventHandler<TWorker, Contract>
    ) {
        super();
        this.type = `WorkerPool:Worker:${contract}`;
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
            try {
                this.workers.logger.debug(`Executing ${this.workers.type} worker pool event handler ${this.name}`);
                this.execute({ worker, data, id, reply });
            } catch (err: unknown) {
                this.workers.logger.error(`${this.workers.type} worker pool event handler ${this.name} threw an error`, err);
            }
        };
        this.#handlers.set(worker, handler);
        worker.on(this.contract, handler);
    }

    private detach(worker: TWorker): void {
        const handler = this.#handlers.get(worker);
        if (handler === undefined)
            return;
        worker.off(this.contract, handler);
        this.#handlers.delete(worker);
    }
}
