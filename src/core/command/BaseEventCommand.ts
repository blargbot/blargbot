import { Cluster } from '../../cluster';
import { EventType, StoredEvent, StoredEventOptions } from '../database';
import { BaseCommand } from './BaseCommand';
import { CommandOptions } from './types';


export abstract class BaseEventCommand<K extends EventType> extends BaseCommand {
    public readonly name: K;
    public constructor(cluster: Cluster, options: CommandOptions & { name: K }) {
        super(cluster, options);
        this.name = options.name;
    }
    public abstract handleEvent(event: StoredEvent<K>): Promise<void> | void;
    protected async _scheduleEvent(event: StoredEventOptions<K>): Promise<StoredEvent<K> | undefined> {
        return await this.database.events.add(this.name, event);
    }
}
