import { Cluster } from '@cluster';
import { IntervalService } from '@core/serviceTypes';

export class ContributorInterval extends IntervalService {
    public readonly type: string = 'bbtag';

    public constructor(private readonly cluster: Cluster) {
        super(1, 'hour', cluster.logger, true);
    }

    protected async execute(): Promise<void> {
        await this.cluster.contributors.refresh();
    }
}
