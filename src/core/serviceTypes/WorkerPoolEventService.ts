import { GetWorkerPoolEventHandler, IPCContracts, ProcessMessageHandler, WorkerIPCContractNames, WorkerPoolEventContext } from '@blargbot/core/types';
import { WorkerConnection, WorkerPool } from '@blargbot/core/worker';

import { BaseService } from './BaseService';

export abstract class WorkerPoolEventService<TWorker extends WorkerConnection<IPCContracts>, Contract extends WorkerIPCContractNames<TWorker>> extends BaseService {
    public readonly type: string;
    readonly #attach: (worker: TWorker) => void;
    readonly #detach: (worker: TWorker) => void;
    readonly #handlers: WeakMap<TWorker, ProcessMessageHandler>;
    readonly #execute: (context: WorkerPoolEventContext<TWorker, unknown, unknown>) => void;

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
        this.#execute = this.makeSafeCaller(execute, workers.logger, `${this.workers.type} worker pool event handler`);
    }

    public start(): void {
        this.workers.on(`spawningWorker`, this.#attach);
        this.workers.on(`killingWorker`, this.#detach);
    }

    public stop(): void {
        this.workers.off(`spawningWorker`, this.#attach);
        this.workers.off(`killingWorker`, this.#detach);
    }

    protected attach(worker: TWorker): void {
        const handler: ProcessMessageHandler = message => this.#execute({ ...message, worker });
        this.#handlers.set(worker, handler);
        worker.on(this.contract, handler);
    }

    protected detach(worker: TWorker): void {
        const handler = this.#handlers.get(worker);
        if (handler === undefined)
            return;
        worker.off(this.contract, handler);
        this.#handlers.delete(worker);
    }
}
