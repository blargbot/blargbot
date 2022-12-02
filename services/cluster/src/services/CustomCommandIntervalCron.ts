import { Cluster } from '@blargbot/cluster';
import { CronService } from '@blargbot/core/serviceTypes/index.js';

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
