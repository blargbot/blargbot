import { Cluster } from '@cluster';
import { BBTagContext, rules } from '@cluster/bbtag';
import { TimeoutEventService } from '@cluster/serviceTypes';
import { StoredEvent, TagStoredEventOptions, TagV4StoredEventOptions } from '@core/types';

export class TimeoutTagEventService extends TimeoutEventService<'tag'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'tag', cluster.logger);
    }
    protected async execute(event: StoredEvent<'tag'>): Promise<void> {
        const migratedEvent = this.migrateEvent(event);
        if (migratedEvent === undefined)
            return;

        const context = await BBTagContext.deserialize(this.cluster.bbtag, migratedEvent.context);
        context.limit.addRules(['timer', 'output'], rules.DisabledRule.instance);
        context.state.replyToExecuting = false;
        context.state.stackSize--;
        await this.cluster.bbtag.execute(migratedEvent.content, context);
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
