import type { Cluster, TimeoutManager } from '@blargbot/cluster';
import { IntervalService } from '@blargbot/core';

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
