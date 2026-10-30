import type { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster';
import type { StoredEvent } from '@blargbot/domain';

export class TimeoutPollEventService extends TimeoutEventService<'poll'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'poll', cluster.logger);
    }

    public async execute(event: StoredEvent<'poll'>): Promise<void> {
        await this.cluster.polls.pollExpired(event);
    }
}
