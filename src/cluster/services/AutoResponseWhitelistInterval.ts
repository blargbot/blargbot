import { Cluster } from '@cluster';
import { IntervalService } from '@core/serviceTypes';

export class AutoResponseWhitelistInterval extends IntervalService {
    public readonly type: string = 'bbtag';

    public constructor(private readonly cluster: Cluster) {
        super(15, 'minutes', cluster.logger, true);
    }

    public async execute(): Promise<void> {
        await this.cluster.autoresponses.refresh();
    }
}
