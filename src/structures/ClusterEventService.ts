import { Cluster } from '../cluster';
import { ClusterContract } from '../workers/ClusterContract';
import { ContractKey, MasterMessageHandlers } from '../workers/core/Contract';
import { BaseService } from './BaseService';
import { inspect } from 'util';

export abstract class ClusterEventService<TEvent extends ContractKey<ClusterContract>> extends BaseService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #execute: (...args: MasterMessageHandlers<ClusterContract>[TEvent]) => void;
    public readonly type: string;

    protected constructor(
        public readonly cluster: Cluster,
        public readonly event: TEvent
    ) {
        super();
        this.type = `ClusterEvent:${this.event}`;
        this.#execute = (...args: MasterMessageHandlers<ClusterContract>[TEvent]) => void this._execute(...args);
    }

    protected abstract execute(...args: MasterMessageHandlers<ClusterContract>[TEvent]): Promise<void> | void;

    public start(): void {
        this.cluster.worker.on(this.event, this.#execute);
    }

    public stop(): void {
        this.cluster.worker.off(this.event, this.#execute);
    }

    private async _execute(...args: MasterMessageHandlers<ClusterContract>[TEvent]): Promise<void> {
        try {
            await this.execute(...args);
        } catch (err) {
            this.cluster.logger.error(`Discord event handler ${this.name} threw an error: ${inspect(err)}`);
            this.stop();
        }
    }
}
