import type { SerializedBBTagContext } from '@blargbot/bbtag';
import { bbtag, rules } from '@blargbot/bbtag';
import { OutputSubtag } from '@blargbot/bbtag/subtags';
import type { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster';
import type { StoredEvent } from '@blargbot/domain';

export class TimeoutTagEventService extends TimeoutEventService<'tag'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'tag', cluster.logger);
    }
    public async execute(event: StoredEvent<'tag'>): Promise<void> {
        if (event.version !== 4)
            return;

        const context = await this.cluster.bbtag.deserialize(JSON.parse(event.context) as unknown as SerializedBBTagContext);
        context.root.limit.addRules(['timer', 'output'], rules.disabledRule);
        const expr = bbtag.parse(event.content);
        const result = await context.eval(expr);
        await context.root.variables.persist();
        await OutputSubtag.sendOutput(context, result);
    }
}
