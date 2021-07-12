import { Cluster } from '../Cluster';
import { BBTagContext, bbtagUtil, rules, StoredEvent, TagStoredEventOptions, TagV4StoredEventOptions, TimeoutEventService } from '../core';

export class TimeoutTagEventService extends TimeoutEventService<'tag'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'tag', cluster.logger);
    }
    protected async execute(event: StoredEvent<'tag'>): Promise<void> {
        const migratedEvent = this.migrateEvent(event);
        if (migratedEvent === undefined)
            return;

        const context = await BBTagContext.deserialize(this.cluster.bbtag, migratedEvent.context);
        const source = bbtagUtil.parse(migratedEvent.content);
        context.limit.addRules(['timer', 'output'], rules.DisabledRule.instance);

        await this.cluster.bbtag.eval(source, context);
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
