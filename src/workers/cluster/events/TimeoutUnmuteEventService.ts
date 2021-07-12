import { Cluster } from '../Cluster';
import { StoredEvent, TimeoutEventService } from '../core';

export class TimeoutUnmuteEventService extends TimeoutEventService<'unmute'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'unmute', cluster.logger);
    }
    protected async execute(event: StoredEvent<'unmute'>): Promise<void> {
        await this.cluster.moderation.mutes.muteExpired(event);
    }
}
