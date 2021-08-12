import { Cluster } from '@cluster';
import { IntervalService } from '@core/serviceTypes';

export class DomainWhitelistInterval extends IntervalService {
    public readonly type: string = 'bbtag';

    public constructor(private readonly cluster: Cluster) {
        super(15, 'minutes', cluster.logger, true);
    }

    protected async execute(): Promise<void> {
        await this.cluster.domains.refresh();
    }
}
