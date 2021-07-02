import { IntervalService, TimeoutManager } from '../core';
import { Cluster } from '../Cluster';

export class TimeoutRefresh extends IntervalService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #timeouts: TimeoutManager;
    public readonly type: string = 'timeout';

    public constructor(cluster: Cluster) {
        super(5, 'minutes', cluster.logger, true);
        this.#timeouts = cluster.timeouts;
    }

    protected async execute(): Promise<void> {
        await this.#timeouts.obtain(this.period);
    }
}
