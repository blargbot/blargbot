import { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster/serviceTypes';
import { StoredEvent } from '@blargbot/domain/models';

export class TimeoutUntimeoutEventService extends TimeoutEventService<'untimeout'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'untimeout', cluster.logger);
    }
    public async execute(event: StoredEvent<'untimeout'>): Promise<void> {
        await this.cluster.moderation.timeouts.timeoutExpired(event);
    }
}
