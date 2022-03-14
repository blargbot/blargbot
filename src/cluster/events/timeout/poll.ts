import { Cluster } from '@cluster';
import { TimeoutEventService } from '@cluster/serviceTypes';
import { StoredEvent } from '@core/types';

export class TimeoutPollEventService extends TimeoutEventService<'poll'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'poll', cluster.logger);
    }

    public async execute(event: StoredEvent<'poll'>): Promise<void> {
        await this.cluster.polls.pollExpired(event);
    }
}
