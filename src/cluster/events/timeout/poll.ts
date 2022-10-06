import { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster/serviceTypes';
import { StoredEvent } from '@blargbot/domain/models';

export class TimeoutPollEventService extends TimeoutEventService<`poll`> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, `poll`, cluster.logger);
    }

    public async execute(event: StoredEvent<`poll`>): Promise<void> {
        await this.cluster.polls.pollExpired(event);
    }
}
