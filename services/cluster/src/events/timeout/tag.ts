import type { SerializedBBTagContext } from '@blargbot/bbtag';
import { BBTagContext, disabledRule } from '@blargbot/bbtag';
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

        const context = await BBTagContext.deserialize(this.cluster.bbtag, JSON.parse(event.context) as unknown as SerializedBBTagContext);
        context.limit.addRules(['timer', 'output'], disabledRule);
        context.data.stackSize = 0;

        await context.engine.execute(event.content, context);
    }
}
