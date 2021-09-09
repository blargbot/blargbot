import { Logger } from '@core/Logger';
import { guard } from '@core/utils';
import { Cursor, Expression, TableQuery, UpdateRequest, WriteResult } from 'rethinkdb';

import { RethinkDb } from './RethinkDb';

export abstract class RethinkDbTable<Table> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #rethinkDb: RethinkDb;

    protected constructor(
        protected readonly table: string,
        rethinkDb: RethinkDb,
        protected readonly logger: Logger
    ) {
        this.#rethinkDb = rethinkDb;
    }

    protected async rquery<T>(query: TableQuery<T, Table>): Promise<T>;
    protected async rquery<T>(query: TableQuery<T | undefined, Table>): Promise<T | undefined>;
    protected async rquery<T>(query: TableQuery<T | undefined, Table>): Promise<T | undefined> {
        return await this.#rethinkDb.query(r => query(r.table(this.table), r));
    }

    protected async rqueryAll<T>(query: TableQuery<Cursor<T>, Table>): Promise<T[]> {
        return await this.#rethinkDb.queryAll(r => query(r.table(this.table), r));
    }

    protected rstream<T>(query: TableQuery<Cursor<T>, Table>): AsyncIterableIterator<T> {
        return this.#rethinkDb.stream(r => query(r.table(this.table), r));
    }

    protected async rget(key: string): Promise<Table | undefined> {
        return await this.rquery(t => t.get(key)) ?? undefined;
    }

    protected async rinsert(value: Table, returnValue?: false): Promise<boolean>
    protected async rinsert(value: Table, returnValue: true): Promise<Table | undefined>
    protected async rinsert(value: Table, returnValue = false): Promise<boolean | Table | undefined> {
        const result = await this.rquery(t => t.insert(this.addExpr(value), { returnChanges: returnValue }));
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

    protected async rset(key: string, value: Table, returnValue?: false): Promise<boolean>
    protected async rset(key: string, value: Table, returnValue: true): Promise<Table | undefined>
    protected async rset(key: string, value: Table, returnValue = false): Promise<boolean | Table | undefined> {
        const result = await this.rquery(t => t.get(key).replace(this.addExpr(value), { returnChanges: returnValue }));
        throwIfErrored(result);

        if (returnValue)
            return result.changes?.[0]?.new_val;

        return result.inserted + result.replaced > 0;
    }

    protected async rupdate(key: string, value: UpdateRequest<Table>, returnValue?: false): Promise<boolean>
    protected async rupdate(key: string, value: UpdateRequest<Table>, returnValue: true): Promise<Table | undefined>
    protected async rupdate(key: string, value: UpdateRequest<Table>, returnValue = false): Promise<boolean | Table | undefined> {
        const updater = 'eq' in value || typeof value === 'object' ? () => value : value;
        const result = await this.rquery(t => t.get(key).update(r => updater(r), { returnChanges: returnValue }));
        throwIfErrored(result);

        if (returnValue)
            return result.changes?.[0]?.new_val;

        return result.replaced + result.unchanged > 0;
    }

    protected async rdelete(key: string | Partial<Table>, returnChanges?: false): Promise<boolean>
    protected async rdelete(key: string | Partial<Table>, returnChanges: true): Promise<Table[]>
    protected async rdelete(key: string | Partial<Table>, returnChanges = false): Promise<boolean | Table[]> {
        const result = typeof key === 'string'
            ? await this.rquery(t => t.get(key).delete({ returnChanges }))
            : await this.rquery(t => t.filter(key).delete({ returnChanges }));
        throwIfErrored(result);

        if (!returnChanges)
            return result.deleted > 0;

        return result.changes?.map(c => c.old_val).filter(guard.hasValue) ?? [];
    }

    protected updateExpr<T>(value: T): T {
        return this.#rethinkDb.updateExpr(value);
    }

    protected addExpr<T>(value: T): T {
        return this.#rethinkDb.addExpr(value);
    }

    protected setExpr(value?: undefined): Expression<undefined>;
    protected setExpr<T>(value: T): Expression<T>;
    protected setExpr<T>(value: T | undefined): Expression<T | undefined> {
        return this.#rethinkDb.setExpr(value);
    }

    protected expr<T>(value: T): Expression<T> {
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

    public migrate(): Promise<void> {
        return Promise.resolve();
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
