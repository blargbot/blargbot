import { Cluster } from '../Cluster';
import { IntervalService } from '@cluster/core';

export class AutoResponseWhitelistInterval extends IntervalService {
    public readonly type: string = 'bbtag';

    public constructor(private readonly cluster: Cluster) {
        super(15, 'minutes', cluster.logger, true);
    }

    protected async execute(): Promise<void> {
        await this.cluster.autoresponses.refresh();
    }
}
