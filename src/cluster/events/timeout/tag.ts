import type { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster';
import type { StoredEvent } from '@blargbot/domain';

export class TimeoutTagEventService extends TimeoutEventService<'tag'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'tag', cluster.logger);
    }
    public async execute(event: StoredEvent<'tag'>): Promise<void> {
        await this.cluster.bbtag.resume(event);
    }
}
