import { Cluster } from '@cluster';
import { BaseService } from '@core/serviceTypes';
import { ProcessMessageHandler, TypeMapping } from '@core/types';

export abstract class ClusterEventService<TData, TReply = never> extends BaseService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #execute: ProcessMessageHandler<unknown, unknown>
    public readonly type: string;

    protected constructor(
        public readonly cluster: Cluster,
        public readonly event: string,
        protected readonly mapping: TypeMapping<TData>,
        protected readonly execute: ProcessMessageHandler<TData, TReply>
    ) {
        super();
        this.type = `ClusterEvent:${this.event}`;
        this.#execute = ({ data, id, reply }): void => {
            const mapped = this.mapping(data);
            if (!mapped.valid)
                return this.cluster.logger.error(`Cluster event handler ${this.name} got invalid arguments`, data);

            try {
                this.execute({ data: mapped.value, id, reply });
            } catch (err: unknown) {
                this.cluster.logger.error(`Cluster event handler ${this.name} threw an error`, err);
            }
        };
    }

    public start(): void {
        this.cluster.worker.on(this.event, this.#execute);
    }

    public stop(): void {
        this.cluster.worker.off(this.event, this.#execute);
    }
}
