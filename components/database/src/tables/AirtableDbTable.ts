import { Logger } from '@blargbot/logger';
import type { FieldSet, Record as AirRecord, Record, Table } from 'airtable';
import type { AirtableBase } from 'airtable/lib/airtable_base.js';
import AirtableError from 'airtable/lib/airtable_error.js';

type FieldSetLike<T> = { [P in keyof T]: T[P] extends FieldSet[keyof FieldSet] ? T[P] : never }

export class AirtableDbTable<T extends FieldSetLike<T>> {
    public constructor(
        public readonly client: AirtableBase,
        public readonly tableName: string,
        public readonly logger: Logger
    ) {
    }

    public async query<R>(query: (table: Table<T>) => R | Promise<R>): Promise<R> {
        try {
            return await query(this.client<T>(this.tableName));
        } catch (ex: unknown) {
            if (ex instanceof AirtableError)
                Error.captureStackTrace(ex);
            throw ex;
        }
    }

    public async find<P extends string & PropertyNamesOfType<T, string | number | undefined>>(column: P, value: string | number): Promise<AirRecord<T> | undefined> {
        try {
            const records = await this.query(t => t.select({
                maxRecords: 1,
                filterByFormula: `{${column}} = '${value}'`
            }).firstPage());

            return records[0];
        } catch (err: unknown) {
            if (err instanceof AirtableError)
                return undefined;
            throw err;
        }
    }
    public async get(id: string): Promise<AirRecord<T> | undefined> {
        try {
            return await this.query(t => t.find(id));
        } catch (err: unknown) {
            if (err instanceof AirtableError)
                return undefined;
            throw err;
        }
    }

    public async create(value: T): Promise<Record<T> | undefined> {
        try {
            return await this.query(t => t.create(value, { typecast: true }));
        } catch (err: unknown) {
            if (err instanceof AirtableError)
                return undefined;
            throw err;
        }
    }

    public async update(id: string, update: Partial<T>): Promise<Record<T> | undefined> {
        try {
            return await this.query(t => t.update(id, update));
        } catch (err: unknown) {
            if (err instanceof AirtableError)
                return undefined;
            throw err;
        }
    }
}
