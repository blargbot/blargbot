import { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster/serviceTypes';
import { StoredEvent } from '@blargbot/domain/models';

export class TimeoutUnbanEventService extends TimeoutEventService<'unban'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'unban', cluster.logger);
    }

    public async execute(event: StoredEvent<'unban'>): Promise<void> {
        await this.cluster.moderation.bans.banExpired(event);
    }
}
