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
        const after = moment(from).valueOf();
        const before = moment(to).valueOf();
        return await this.rqueryAll(t => t.between(after, before, { index: 'endtime' }));
    }

    public async add<K extends EventType>(type: K, event: StoredEventOptions<K>): Promise<StoredEvent<K> | undefined> {
        const insert = populateEvent(type, event);
        if (!await this.rinsert(insert, true))
            return undefined;
        return insert;
    }

    public async delete(eventId: string): Promise<boolean>;
    public async delete(filter: Partial<StoredEventOptions>): Promise<boolean>;
    public async delete(filter: string | Partial<StoredEventOptions>): Promise<boolean> {
        return await this.rdelete(filter);
    }

    public async list(source: string, pageNumber: number, pageSize: number): Promise<{ events: StoredEvent[]; total: number; }> {
        const events = await this.rqueryAll(t => t.filter({ source }).slice(pageNumber * pageSize, (pageNumber + 1) * pageSize));
        const total = await this.rquery(t => t.filter({ source }).count());
        return { events, total };
    }

    public async getIds(source: string): Promise<string[]> {
        return await this.rqueryAll(t => t.filter({ source }).getField('id'));
    }

    public async get(eventId: string): Promise<StoredEvent | undefined> {
        return await this.rquery(t => t.get(eventId)) ?? undefined;
    }

}

function populateEvent<K extends EventType>(type: K, event: StoredEventOptions<K>): StoredEvent<K> {
    return {
        ...event,
        starttime: moment().valueOf(),
        type: type,
        id: undefined
    } as never;
}
