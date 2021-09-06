import { Cluster } from '@cluster';
import { TimeoutEventService } from '@cluster/serviceTypes';
import { StoredEvent } from '@core/types';

export class TimeoutUnmuteEventService extends TimeoutEventService<'unmute'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'unmute', cluster.logger);
    }
    public async execute(event: StoredEvent<'unmute'>): Promise<void> {
        await this.cluster.moderation.mutes.muteExpired(event);
    }
}
