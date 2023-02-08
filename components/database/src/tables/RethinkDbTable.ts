import { hasValue } from '@blargbot/guards';
import type { Logger } from '@blargbot/logger';
import type { Cursor, Expression, TableQuery, UpdateRequest, WriteResult } from 'rethinkdb';

import type { RethinkDb } from '../clients/index.js';

export class RethinkDbTable<Table> {
    readonly #rethinkDb: RethinkDb;

    public constructor(
        public readonly table: string,
        rethinkDb: RethinkDb,
        public readonly logger: Logger
    ) {
        this.#rethinkDb = rethinkDb;
    }

    public async query<T>(query: TableQuery<T, Table>): Promise<T>;
    public async query<T>(query: TableQuery<T | undefined, Table>): Promise<T | undefined>;
    public async query<T>(query: TableQuery<T | undefined, Table>): Promise<T | undefined> {
        return await this.#rethinkDb.query(r => query(r.table(this.table), r));
    }

    public async queryAll<T>(query: TableQuery<Cursor<T>, Table>): Promise<T[]> {
        return await this.#rethinkDb.queryAll(r => query(r.table(this.table), r));
    }

    public stream<T>(query: TableQuery<Cursor<T>, Table>): AsyncIterableIterator<T> {
        return this.#rethinkDb.stream(r => query(r.table(this.table), r));
    }

    public async get(key: string): Promise<Table | undefined> {
        return await this.query(t => t.get(key)) ?? undefined;
    }

    public async insert(value: Table, returnValue?: false): Promise<boolean>
    public async insert(value: Table, returnValue: true): Promise<Table | undefined>
    public async insert(value: Table, returnValue = false): Promise<boolean | Table | undefined> {
        const result = await this.query(t => t.insert(this.addExpr(value), { returnChanges: returnValue }));
        try {
            throwIfErrored(result);
        } catch (err: unknown) {
            if (err instanceof Error && err.message.startsWith('Duplicate primary key'))
                return returnValue ? undefined : false;
            throw err;
        }

        if (returnValue)
            return result.changes?.[0]?.new_val;

        return result.inserted > 0;
    }

    public async set(key: string, value: Table, returnValue?: false): Promise<boolean>
    public async set(key: string, value: Table, returnValue: true): Promise<Table | undefined>
    public async set(key: string, value: Table, returnValue = false): Promise<boolean | Table | undefined> {
        const result = await this.query(t => t.get(key).replace(this.addExpr(value), { returnChanges: returnValue }));
        throwIfErrored(result);

        if (returnValue)
            return result.changes?.[0]?.new_val;

        return result.inserted + result.replaced > 0;
    }

    public async update(key: string, value: UpdateRequest<Table>, returnValue?: false): Promise<boolean>
    public async update(key: string, value: UpdateRequest<Table>, returnValue: true): Promise<Table | undefined>
    public async update(key: string, value: UpdateRequest<Table>, returnValue = false): Promise<boolean | Table | undefined> {
        const updater = 'eq' in value || typeof value === 'object' ? () => value : value;
        const result = await this.query(t => t.get(key).update(r => updater(r), { returnChanges: returnValue }));
        throwIfErrored(result);

        if (returnValue)
            return result.changes?.[0]?.new_val;

        return result.replaced + result.unchanged > 0;
    }

    public async delete(key: string | Partial<Table>, returnChanges?: false): Promise<boolean>
    public async delete(key: string | Partial<Table>, returnChanges: true): Promise<Table[]>
    public async delete(key: string | Partial<Table>, returnChanges = false): Promise<boolean | Table[]> {
        const result = typeof key === 'string'
            ? await this.query(t => t.get(key).delete({ returnChanges }))
            : await this.query(t => t.filter(key).delete({ returnChanges }));
        throwIfErrored(result);

        if (!returnChanges)
            return result.deleted > 0;

        return result.changes?.map(c => c.old_val).filter(hasValue) ?? [];
    }

    public updateExpr<T>(value: T): T {
        return this.#rethinkDb.updateExpr(value);
    }

    public addExpr<T>(value: T): T {
        return this.#rethinkDb.addExpr(value);
    }

    public setExpr(value?: undefined): Expression<undefined>;
    public setExpr<T>(value: T): Expression<T>;
    public setExpr<T>(value: T | undefined): Expression<T | undefined> {
        return this.#rethinkDb.setExpr(value);
    }

    public expr<T>(value: T): Expression<T> {
        return this.#rethinkDb.expr(value);
    }

    public branchExpr<T>(
        context: Expression<T>,
        test: (context: Expression<T>) => Expression<boolean>,
        ifTrue: (context: Expression<T>) => Expression<T>,
        ifFalse?: (context: Expression<T>) => Expression<T>
    ): Expression<T>;
    public branchExpr<TContext, TResult>(
        context: Expression<TContext>,
        test: (context: Expression<TContext>) => Expression<boolean>,
        ifTrue: (context: Expression<TContext>) => Expression<TResult>,
        ifFalse: (context: Expression<TContext>) => Expression<TResult>
    ): Expression<TResult>;
    public branchExpr<T>(
        context: Expression<T>,
        test: (context: Expression<T>) => Expression<boolean>,
        ifTrue: (context: Expression<T>) => Expression<T>,
        ifFalse?: (context: Expression<T>) => Expression<T>
    ): Expression<T> {
        return this.#rethinkDb.branchExpr(context, test, ifTrue, ifFalse);
    }
}

function throwIfErrored<T>(result: WriteResult<T>): void | never {
    if (result.errors === 0)
        return;

    const error = typeof result.first_error === 'string'
        ? new Error(result.first_error)
        : result.first_error;

    Error.captureStackTrace(error, throwIfErrored);
    throw error;
}
