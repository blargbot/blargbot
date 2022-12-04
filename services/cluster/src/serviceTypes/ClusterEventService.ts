import type { Cluster } from '@blargbot/cluster';
import type { ClusterIPCContract } from '@blargbot/cluster/types.js';
import { BaseService } from '@blargbot/core/serviceTypes/index.js';
import type { GetWorkerProcessMessageHandler, IPCContractNames } from '@blargbot/core/types.js';

export abstract class ClusterEventService<Contract extends IPCContractNames<ClusterIPCContract>> extends BaseService {
    readonly #execute: GetWorkerProcessMessageHandler<ClusterIPCContract, Contract>;
    public readonly type: string;

    protected constructor(
        public readonly cluster: Cluster,
        public readonly event: Contract,
        protected readonly execute: GetWorkerProcessMessageHandler<ClusterIPCContract, Contract>
    ) {
        super();
        this.type = `ClusterEvent:${this.event}`;
        this.#execute = this.makeSafeCaller(execute, this.cluster.logger, 'Cluster event handler');
    }

    public start(): void {
        this.cluster.worker.on(this.event, this.#execute);
    }

    public stop(): void {
        this.cluster.worker.off(this.event, this.#execute);
    }
}
