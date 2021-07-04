import { RethinkDb, RethinkDbTable } from './core';
import { EventsTable, EventType, StoredEvent, StoredEventOptions } from './types';
import { Moment } from 'moment-timezone';
import moment from 'moment';
import { Logger } from '../Logger';

export class RethinkDbEventsTable extends RethinkDbTable<'events'> implements EventsTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super('events', rethinkDb, logger);
    }

    public async between(from: Date | Moment | number, to: Date | Moment | number): Promise<StoredEvent[]> {
        const after = moment(from).toDate();
        const before = moment(to).toDate();
        return await this.rqueryAll(t => t.between(after, before, { index: 'endtime' }));
    }

    public async add<K extends EventType>(type: K, event: StoredEventOptions<K>): Promise<StoredEvent<K> | undefined> {
        const insert = { ...event, type };
        if (!await this.rinsert(insert, true))
            return undefined;

        return <StoredEvent<K>><unknown>insert;
    }

    public async delete(eventId: string): Promise<boolean>;
    public async delete(filter: Partial<StoredEventOptions>): Promise<boolean>;
    public async delete(filter: string | Partial<StoredEventOptions>): Promise<boolean> {
        return await this.rdelete(filter);
    }

}
