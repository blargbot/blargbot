import { Cluster } from '@blargbot/cluster';
import { BBTagContext, rules } from '@blargbot/cluster/bbtag';
import { TimeoutEventService } from '@blargbot/cluster/serviceTypes';
import { bbtag } from '@blargbot/cluster/utils';
import { StoredEvent, TagStoredEventOptions, TagV4StoredEventOptions } from '@blargbot/core/types';

export class TimeoutTagEventService extends TimeoutEventService<'tag'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'tag', cluster.logger);
    }
    public async execute(event: StoredEvent<'tag'>): Promise<void> {
        const migratedEvent = this.migrateEvent(event);
        if (migratedEvent === undefined)
            return;

        const context = await BBTagContext.deserialize(this.cluster.bbtag, migratedEvent.context);
        context.limit.addRules(['timer', 'output'], rules.disabledRule);
        context.data.stackSize--;

        const ast = bbtag.parse(migratedEvent.content);
        await context.engine.eval(ast, context);
    }

    private migrateEvent<T extends TagStoredEventOptions>(event: T): TagV4StoredEventOptions | undefined {
        switch (event.version) {
            case undefined: // TODO actual migration
            case 0: return undefined;
            case 1: return undefined;
            case 2: return undefined;
            case 3: return undefined;
            case 4: return event;
        }
    }
}
