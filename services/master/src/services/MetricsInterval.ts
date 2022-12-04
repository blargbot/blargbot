import { CronService } from '@blargbot/core/serviceTypes/index.js';
import type { Master } from '@blargbot/master';

export class MetricsInterval extends CronService {
    public readonly type = 'discord';

    public constructor(
        public readonly master: Master
    ) {
        super({ cronTime: '*/15 * * * * *' }, master.logger);
    }

    public async execute(): Promise<void> {
        await this.master.clusters.forEach(async (id, cluster) => {
            const res = await cluster?.request('metrics', undefined);
            this.master.metrics[id] = res ?? [];
        });
    }
}
