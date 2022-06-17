import { Cluster } from '@blargbot/cluster';
import { TimeoutManager } from '@blargbot/cluster/managers';
import { IntervalService } from '@blargbot/core/serviceTypes';

export class TimeoutTrigger extends IntervalService {
    readonly #timeouts: TimeoutManager;
    public readonly type: string = 'timeout';

    public constructor(cluster: Cluster) {
        super(10, 'seconds', cluster.logger);
        this.#timeouts = cluster.timeouts;
    }

    public async execute(): Promise<void> {
        await this.#timeouts.process();
    }
}
