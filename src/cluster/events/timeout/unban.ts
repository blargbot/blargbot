import type { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster';
import type { StoredEvent } from '@blargbot/domain';

export class TimeoutUnbanEventService extends TimeoutEventService<'unban'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'unban', cluster.logger);
    }

    public async execute(event: StoredEvent<'unban'>): Promise<void> {
        await this.cluster.moderation.bans.banExpired(event);
    }
}
