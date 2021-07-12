import { Cluster } from '../Cluster';
import { StoredEvent, TimeoutEventService } from '../core';

export class TimeoutUnbanEventService extends TimeoutEventService<'unban'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'unban', cluster.logger);
    }

    protected async execute(event: StoredEvent<'unban'>): Promise<void> {
        await this.cluster.moderation.bans.banExpired(event);
    }
}
