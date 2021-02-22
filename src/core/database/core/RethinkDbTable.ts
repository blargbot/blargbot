import { Cursor, RethinkDb, TableQuery } from './RethinkDb';
import { RethinkTableMap } from '../types';
import { r } from './RethinkDb';
import { Expression } from 'rethinkdb';
import { WriteResult } from 'rethinkdb';

export type UpdateRequest<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [P in keyof T]?: T[P] | Expression<T[P]> | UpdateRequest<T[P]>
}

export abstract class RethinkDbTable<T extends keyof RethinkTableMap> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #rethinkDb: RethinkDb;

    protected constructor(
        protected readonly table: T,
        rethinkDb: RethinkDb,
        protected readonly logger: CatLogger
    ) {
        this.#rethinkDb = rethinkDb;
    }

    protected async rquery<T>(query: TableQuery<T>): Promise<T>;
    protected async rquery<T>(query: TableQuery<T | undefined>): Promise<T | undefined>;
    protected async rquery<T>(query: TableQuery<T | undefined>): Promise<T | undefined> {
        return await this.#rethinkDb.query(r => query(r.table(this.table), r));
    }

    protected async rqueryAll<T>(query: TableQuery<Cursor>): Promise<T[]> {
        return await this.#rethinkDb.queryAll(r => query(r.table(this.table), r));
    }

    protected rstream<T>(query: TableQuery<Cursor>): AsyncIterableIterator<T> {
        return this.#rethinkDb.stream(r => query(r.table(this.table), r));
    }

    protected async rget(
        key: string
    ): Promise<RethinkTableMap[T] | undefined> {
        return await this.rquery(t => t.get<RethinkTableMap[T]>(key)) ?? undefined;
    }

    protected async rinsert(value: RethinkTableMap[T], applyChanges = false): Promise<boolean> {
        const result = await this.rquery(t => t.insert(value, { returnChanges: applyChanges }));
        if (applyChanges && result.changes?.[0]?.new_val)
            Object.apply(value, result.changes?.[0].new_val);
        throwIfErrored(result);
        return result.inserted > 0;
    }

    protected async rset(key: string, value: RethinkTableMap[T], applyChanges = false): Promise<boolean> {
        const result = await this.rquery(t => t.get(key).replace(value, { returnChanges: applyChanges }));
        if (applyChanges && result.changes?.[0]?.new_val)
            Object.apply(value, result.changes?.[0].new_val);
        throwIfErrored(result);
        return result.inserted + result.replaced > 0;
    }

    protected async rupdate(
        key: string,
        value: UpdateRequest<RethinkTableMap[T]> | ((r: r) => UpdateRequest<RethinkTableMap[T]>)
    ): Promise<boolean> {
        const getter = typeof value === 'function' ? value : () => value;
        const result = await this.rquery((t, r) => t.get(key).update(getter(r)));
        throwIfErrored(result);
        return result.replaced + result.unchanged > 0;
    }

    protected async rdelete(
        key: string | Partial<RethinkTableMap[T]>
    ): Promise<boolean> {
        const result = typeof key === 'string'
            ? await this.rquery(t => t.get(key).delete())
            : await this.rquery(t => t.delete(key));
        throwIfErrored(result);
        return result.deleted > 0;
    }

    public migrate(): Promise<void> {
        return Promise.resolve();
    }
}

function throwIfErrored(result: WriteResult): void | never {
    if (result.errors === 0)
        return;

    const error = typeof result.first_error === 'string'
        ? new Error(result.first_error)
        : result.first_error;

    Error.captureStackTrace(error, throwIfErrored);
    throw error;
}