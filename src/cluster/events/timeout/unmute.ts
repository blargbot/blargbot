import { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster/serviceTypes';
import { StoredEvent } from '@blargbot/domain/models';

export class TimeoutUnmuteEventService extends TimeoutEventService<`unmute`> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, `unmute`, cluster.logger);
    }
    public async execute(event: StoredEvent<`unmute`>): Promise<void> {
        await this.cluster.moderation.mutes.muteExpired(event);
    }
}
