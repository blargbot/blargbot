import { RethinkDb } from './core/RethinkDb';
import { EventsTable, StoredEvent } from './types';
import { RethinkDbTable } from './core/RethinkDbTable';
import { Moment } from 'moment-timezone';
import moment from 'moment';


export class RethinkDbEventsTable extends RethinkDbTable<'events'> implements EventsTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: CatLogger
    ) {
        super('events', rethinkDb, logger);
    }

    public async between(from: Date | Moment | number, to: Date | Moment | number): Promise<StoredEvent[]> {
        const after = moment(from).toDate();
        const before = moment(to).toDate();
        return await this.rqueryAll(t => t.between(after, before, { index: 'endtime' }));
    }

    public async add(event: Omit<StoredEvent, 'id'>): Promise<boolean> {
        return await this.rinsert(event, true);
    }

    public async delete(eventId: string): Promise<boolean>;
    public async delete(filter: Partial<StoredEvent>): Promise<boolean>;
    public async delete(filter: string | Partial<StoredEvent>): Promise<boolean> {
        return await this.rdelete(filter);
    }

}
