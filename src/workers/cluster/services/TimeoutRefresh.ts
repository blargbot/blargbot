import { Cluster } from '@cluster';
import { TimeoutManager } from '@cluster/managers';
import { IntervalService } from '@core/serviceTypes';

export class TimeoutRefresh extends IntervalService {
    readonly #timeouts: TimeoutManager;
    public readonly type: string = 'timeout';

    public constructor(cluster: Cluster) {
        super(5, 'minutes', cluster.logger, true);
        this.#timeouts = cluster.timeouts;
    }

    public async execute(): Promise<void> {
        await this.#timeouts.obtain(this.period);
    }
}
