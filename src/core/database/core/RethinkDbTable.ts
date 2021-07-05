import { UpdateData } from 'rethinkdb';
import { BetterExpression, BetterRethinkDb, Sanitized } from 'rethinkdb';
import { TableQuery, Cursor, WriteResult } from 'rethinkdb';
import { Logger } from '../../Logger';
import { guard } from '../../utils';
import { RethinkTableMap } from '../types';
import { RethinkDb } from './RethinkDb';

export abstract class RethinkDbTable<TableName extends keyof RethinkTableMap> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #rethinkDb: RethinkDb;

    protected constructor(
        protected readonly table: TableName,
        rethinkDb: RethinkDb,
        protected readonly logger: Logger
    ) {
        this.#rethinkDb = rethinkDb;
    }

    protected async rquery<T>(query: TableQuery<T, RethinkTableMap[TableName]>): Promise<T>;
    protected async rquery<T>(query: TableQuery<T | undefined, RethinkTableMap[TableName]>): Promise<T | undefined>;
    protected async rquery<T>(query: TableQuery<T | undefined, RethinkTableMap[TableName]>): Promise<T | undefined> {
        return await this.#rethinkDb.query(r => query(r.table(this.table), <BetterRethinkDb<RethinkTableMap[TableName]>>r));
    }

    protected async rqueryAll<T>(query: TableQuery<Cursor, RethinkTableMap[TableName]>): Promise<T[]> {
        return await this.#rethinkDb.queryAll(r => query(r.table(this.table), <BetterRethinkDb<RethinkTableMap[TableName]>>r));
    }

    protected rstream<T>(query: TableQuery<Cursor, RethinkTableMap[TableName]>): AsyncIterableIterator<T> {
        return this.#rethinkDb.stream(r => query(r.table(this.table), <BetterRethinkDb<RethinkTableMap[TableName]>>r));
    }

    protected async rget(key: string): Promise<RethinkTableMap[TableName] | undefined> {
        return await this.rquery(t => t.get<RethinkTableMap[TableName]>(key)) ?? undefined;
    }

    protected async rinsert(value: RethinkTableMap[TableName], applyChanges = false): Promise<boolean> {
        const result = await this.rquery(t => t.insert(this.addExpr(value), { returnChanges: applyChanges }));
        if (applyChanges && guard.hasValue(result.changes?.[0]?.new_val))
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            Object.assign(value, result.changes?.[0].new_val);
        throwIfErrored(result);
        return result.inserted > 0;
    }

    protected async rset(key: string, value: RethinkTableMap[TableName], applyChanges = false): Promise<boolean> {
        const result = await this.rquery(t => t.get(key).replace(this.addExpr(value), { returnChanges: applyChanges }));
        if (applyChanges && guard.hasValue(result.changes?.[0]?.new_val))
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            Object.assign(value, result.changes?.[0].new_val);
        throwIfErrored(result);
        return result.inserted + result.replaced > 0;
    }

    protected async rupdate(key: string, value: UpdateData<RethinkTableMap[TableName]>, applyChanges = false): Promise<boolean> {
        const getter = typeof value === 'object' ? () => value : value;
        const result = await this.rquery((t, r) => t.get(key).update(getter(r), { returnChanges: applyChanges }));
        if (applyChanges && guard.hasValue(result.changes?.[0]?.new_val))
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            Object.assign(value, result.changes?.[0].new_val);
        throwIfErrored(result);
        return result.replaced + result.unchanged > 0;
    }

    protected async rdelete(
        key: string | Partial<RethinkTableMap[TableName]>
    ): Promise<boolean> {
        const result = typeof key === 'string'
            ? await this.rquery(t => t.get(key).delete())
            : await this.rquery(t => t.filter(key).delete());
        throwIfErrored(result);
        return result.deleted > 0;
    }

    protected updateExpr<T>(value: T): Sanitized<T> {
        return this.#rethinkDb.updateExpr(value);
    }

    protected addExpr<T>(value: T): Sanitized<T> {
        return this.#rethinkDb.addExpr(value);
    }

    protected setExpr<T>(value: T): BetterExpression<Sanitized<T>> {
        return this.#rethinkDb.setExpr(value);
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
