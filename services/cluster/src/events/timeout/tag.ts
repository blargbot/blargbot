import type { SerializedBBTagContext } from '@bbtag/blargbot';
import type { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster/serviceTypes/index.js';
import type { StoredEvent } from '@blargbot/domain/models/index.js';

export class TimeoutTagEventService extends TimeoutEventService<'tag'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'tag', cluster.logger);
    }
    public async execute(event: StoredEvent<'tag'>): Promise<void> {
        if (event.version !== 4)
            return;

        const contextData = JSON.parse(event.context) as unknown as SerializedBBTagContext;
        // context.limit.addRules(['timer', 'output'], disabledRule);
        // context.runtime.moduleCount = 0;
        await this.cluster.bbtag.execute(event.content, {
            ...contextData
        });
    }
}
