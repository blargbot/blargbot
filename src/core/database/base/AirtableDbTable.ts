import { Logger } from '@blargbot/core/Logger';
import { FieldSet, Record as AirRecord, Record, Table } from 'airtable';
import { AirtableBase } from 'airtable/lib/airtable_base';
import AirtableError from 'airtable/lib/airtable_error';

type FieldSetLike<T> = { [P in keyof T]: T[P] extends FieldSet[keyof FieldSet] ? T[P] : never }

export abstract class AirtableDbTable<T extends FieldSetLike<T>> {
    public constructor(
        protected readonly client: AirtableBase,
        protected readonly tableName: string,
        protected readonly logger: Logger
    ) {
    }

    protected async aquery<R>(query: (table: Table<T>) => R | Promise<R>): Promise<R> {
        try {
            return await query(this.client<T>(this.tableName));
        } catch (ex: unknown) {
            if (ex instanceof AirtableError)
                Error.captureStackTrace(ex);
            throw ex;
        }
    }

    protected async afind<P extends string & PropertyNamesOfType<T, string | number | undefined>>(column: P, value: string | number): Promise<AirRecord<T> | undefined> {
        try {
            const records = await this.aquery(t => t.select({
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
    protected async aget(id: string): Promise<AirRecord<T> | undefined> {
        try {
            return await this.aquery(t => t.find(id));
        } catch (err: unknown) {
            if (err instanceof AirtableError)
                return undefined;
            throw err;
        }
    }

    protected async acreate(value: T): Promise<Record<T> | undefined> {
        try {
            return await this.aquery(t => t.create(value, { typecast: true }));
        } catch (err: unknown) {
            if (err instanceof AirtableError)
                return undefined;
            throw err;
        }
    }

    protected async aupdate(id: string, update: Partial<T>): Promise<Record<T> | undefined> {
        try {
            return await this.aquery(t => t.update(id, update));
        } catch (err: unknown) {
            if (err instanceof AirtableError)
                return undefined;
            throw err;
        }
    }
}
