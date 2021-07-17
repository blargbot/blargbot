import { Cluster } from '@cluster';
import { IntervalService } from '@core/serviceTypes';

export class BotStaffWhitelistInterval extends IntervalService {
    public readonly type: string = 'bot';

    public constructor(private readonly cluster: Cluster) {
        super(1, 'day', cluster.logger, true);
    }

    protected async execute(): Promise<void> {
        await this.cluster.botStaff.refresh();
    }
}
