import type { Cluster } from '@blargbot/cluster';
import { CronService } from '@blargbot/core';

export class CustomCommandIntervalCron extends CronService {
    public readonly type = 'bbtag';
    public constructor(
        public readonly cluster: Cluster
    ) {
        super({ cronTime: '*/15 * * * *' }, cluster.logger);
    }

    public async execute(): Promise<void> {
        await this.cluster.intervals.invokeAll();
    }
}
