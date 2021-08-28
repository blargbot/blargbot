import { AirtableOptions } from '@core/types';
import Airtable, { FieldSet, Record as AirRecord, Record, Table } from 'airtable';
import { AirtableBase } from 'airtable/lib/airtable_base';
import AirtableError from 'airtable/lib/airtable_error';

type FieldSetLike<T> = { [P in keyof T]: T[P] extends FieldSet[keyof FieldSet] ? T[P] : never }

export class AirtableDb<ModelMap extends { [P in keyof ModelMap]: FieldSetLike<ModelMap[P]> }> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #client: AirtableBase

    public constructor(options: AirtableOptions) {
        this.#client = new Airtable({
            apiKey: options.key
        }).base(options.base);
    }

    public async connect(): Promise<void> {
        try {
            await this.#client.makeRequest({ path: '/_' });
        } catch (err: unknown) {
            if (err instanceof AirtableError && err.message.startsWith('Could not find table _ in application'))
                return;
            throw err;
        }
    }

    public async query<K extends string & keyof ModelMap, R>(table: K, query: (table: Table<ModelMap[K]>) => R | Promise<R>): Promise<R> {
        try {
            return await query(this.#client<ModelMap[K]>(table));
        } catch (ex: unknown) {
            if (ex instanceof AirtableError)
                Error.captureStackTrace(ex);
            throw ex;
        }
    }

    public async find<K extends string & keyof ModelMap, P extends string & keyof ModelMap[K]>(table: K, column: P, value: string | number): Promise<AirRecord<ModelMap[K]> | undefined> {
        try {
            const records = await this.query(table, t => t.select({
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
    public async get<K extends string & keyof ModelMap>(table: K, id: string): Promise<AirRecord<ModelMap[K]> | undefined> {
        try {
            return await this.query(table, t => t.find(id));
        } catch (err: unknown) {
            if (err instanceof AirtableError)
                return undefined;
            throw err;
        }
    }

    public async create<K extends string & keyof ModelMap>(table: K, value: ModelMap[K]): Promise<Record<ModelMap[K]> | undefined> {
        try {
            return await this.query(table, t => t.create(value, { typecast: true }));
        } catch (err: unknown) {
            if (err instanceof AirtableError)
                return undefined;
            throw err;
        }
    }

    public async update<K extends string & keyof ModelMap>(table: K, id: string, update: Partial<ModelMap[K]>): Promise<Record<ModelMap[K]> | undefined> {
        try {
            return await this.query(table, t => t.update(id, update));
        } catch (err: unknown) {
            if (err instanceof AirtableError)
                return undefined;
            throw err;
        }
    }
}
