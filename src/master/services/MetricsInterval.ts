import { CronService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';

export class MetricsInterval extends CronService {
    public readonly type = 'discord';

    public constructor(
        public readonly master: Master,
    ) {
        super({ cronTime: '*/15 * * * * *' }, master.logger);
    }

    public async execute(): Promise<void> {
        this.master.clusters.forEach((id, cluster) => {
            cluster?.request('metrics', undefined).then(res => {
                this.master.metrics[id] = res;
            });
        });
    }
}
