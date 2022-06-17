import { EventOptionsTypeMap, EventType, StoredEvent, StoredEventOptions } from '@blargbot/domain/models';
import { EventStore } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';
import moment, { Moment } from 'moment-timezone';

import { RethinkDb } from '../clients';
import { RethinkDbTable } from '../tables/RethinkDbTable';

export class RethinkDbEventStore implements EventStore {
    readonly #table: RethinkDbTable<StoredEvent>;

    public constructor(rethinkDb: RethinkDb, logger: Logger) {
        this.#table = new RethinkDbTable('events', rethinkDb, logger);
    }

    public async between(from: Date | Moment | number, to: Date | Moment | number): Promise<StoredEvent[]> {
        const after = moment(from).valueOf();
        const before = moment(to).valueOf();
        return await this.#table.queryAll(t => t.between(after, before, { index: 'endtime' }));
    }

    public async add<K extends EventType>(type: K, event: StoredEventOptions<K>): Promise<StoredEvent<K> | undefined>
    public async add(type: keyof EventOptionsTypeMap, event: StoredEventOptions): Promise<StoredEvent | undefined> {
        return await this.#table.insert(populateEvent(type, event), true);
    }

    public async delete(eventId: string): Promise<boolean>;
    public async delete(filter: Partial<StoredEventOptions>): Promise<readonly string[]>;
    public async delete(filter: string | Partial<StoredEventOptions>): Promise<readonly string[] | boolean> {
        if (typeof filter === 'string')
            return await this.#table.delete(filter);
        const result = await this.#table.delete(filter, true);
        return result.map(r => r.id);
    }

    public async list(source: string, pageNumber: number, pageSize: number): Promise<{ events: StoredEvent[]; total: number; }> {
        const events = await this.#table.queryAll(t => t.filter({ source }).orderBy('endtime').slice(pageNumber * pageSize, (pageNumber + 1) * pageSize));
        const total = await this.#table.query(t => t.filter({ source }).count());
        return { events, total };
    }

    public async getIds(source: string): Promise<string[]> {
        return await this.#table.queryAll(t => t.filter({ source }).getField('id'));
    }

    public async get(eventId: string): Promise<StoredEvent | undefined> {
        return await this.#table.query(t => t.get(eventId)) ?? undefined;
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
