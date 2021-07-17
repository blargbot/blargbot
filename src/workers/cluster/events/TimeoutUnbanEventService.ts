import { Cluster } from '@cluster';
import { TimeoutEventService } from '@cluster/serviceTypes';
import { StoredEvent } from '@core/types';

export class TimeoutUnbanEventService extends TimeoutEventService<'unban'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'unban', cluster.logger);
    }

    protected async execute(event: StoredEvent<'unban'>): Promise<void> {
        await this.cluster.moderation.bans.banExpired(event);
    }
}
