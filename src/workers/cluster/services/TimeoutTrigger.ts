import { Cluster } from '@cluster';
import { TimeoutManager } from '@cluster/TimeoutManager';
import { IntervalService } from '@core/serviceTypes';

export class TimeoutTrigger extends IntervalService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #timeouts: TimeoutManager;
    public readonly type: string = 'timeout';

    public constructor(cluster: Cluster) {
        super(10, 'seconds', cluster.logger);
        this.#timeouts = cluster.timeouts;
    }

    protected async execute(): Promise<void> {
        await this.#timeouts.process();
    }
}
