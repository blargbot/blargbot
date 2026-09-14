import type { Cluster } from '@blargbot/cluster';
import type { TimeoutManager } from '@blargbot/cluster';
import { IntervalService } from '@blargbot/core';

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
