import { bbtag, BBTagContext, rules, SerializedBBTagContext } from '@blargbot/bbtag';
import { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster/serviceTypes';
import { StoredEvent } from '@blargbot/domain/models';

export class TimeoutTagEventService extends TimeoutEventService<'tag'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'tag', cluster.logger);
    }
    public async execute(event: StoredEvent<'tag'>): Promise<void> {
        if (event.version !== 4)
            return;

        const context = await BBTagContext.deserialize(this.cluster.bbtag, JSON.parse(event.context) as unknown as SerializedBBTagContext);
        context.limit.addRules(['timer', 'output'], rules.disabledRule);
        context.data.stackSize--;

        const ast = bbtag.parse(event.content);
        await context.engine.eval(ast, context);
    }
}
