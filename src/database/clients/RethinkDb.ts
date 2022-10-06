import { RethinkConfiguration } from '@blargbot/config/Configuration';
import * as r from 'rethinkdb';
import { Cursor, Expression, Query, Time } from 'rethinkdb';

export class RethinkDb {
    #connection?: Promise<r.Connection>;
    readonly #options: RethinkConfiguration;

    public constructor(options: RethinkConfiguration) {
        this.#options = options;
    }

    public async query<T>(query: Query<T>): Promise<T>
    public async query<T>(query: Query<T | undefined>): Promise<T | undefined>
    public async query<T>(query: Query<T | undefined>): Promise<T | undefined> {
        return await query(r).run(await this.#getConnection());
    }

    public async queryAll<T>(query: Query<Cursor<T>>): Promise<T[]> {
        const stream = this.stream<T>(query);
        const result = [];
        for await (const item of stream)
            result.push(item);
        return result;
    }

    public async * stream<T>(query: Query<Cursor<T>>): AsyncIterableIterator<T> {
        const cursor = await this.query(query);
        while (true) {
            try {
                yield await cursor.next();
            } catch (err: unknown) {
                if (err instanceof Error && err.name === `ReqlDriverError` && err.message === `No more rows in the cursor.`)
                    break;
                throw err;
            }
        }
    }

    public async connect(): Promise<void> {
        await this.#getConnection();
    }

    #getConnection(): Promise<r.Connection> {
        return this.#connection ??= this.#connect();
    }

    async #connect(): Promise<r.Connection> {
        try {
            const connection = await r.connect({
                timeout: 10000,
                ...this.#options
            });
            connection.on(`close`, () => this.#connection = undefined);
            return connection;
        } catch (err: unknown) {
            this.#connection = undefined;
            throw err;
        }
    }

    public async disconnect(): Promise<void> {
        const connection = await this.#connection;
        await connection?.close();
    }

    public epochTime(time: number): Expression<Time> {
        return r.epochTime(time);
    }

    public updateExpr<T>(value: T): T {
        return hackySanitize(value, false);
    }

    public addExpr<T>(value: T): T {
        return hackySanitize(value, true);
    }

    public setExpr(value?: undefined): Expression<undefined>
    public setExpr<T>(value: T): Expression<T>
    public setExpr<T>(value?: T | undefined): Expression<T | undefined> {
        if (value === undefined)
            return r.literal();
        return r.literal(this.addExpr(value));
    }

    public expr<T>(value: T): Expression<T> {
        return r.expr(value);
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
        ifFalse: (context: Expression<T>) => Expression<T> = ctx => ctx
    ): Expression<T> {
        return r.branch(test(context), ifTrue(context), ifFalse(context));
    }
}

function hackySanitize<T>(value: T, removeUndef: boolean): T;
function hackySanitize(value: unknown, removeUndef: boolean): unknown {
    switch (typeof value) {
        case `undefined`:
            return r.literal();
        case `string`:
        case `bigint`:
        case `boolean`:
        case `function`:
        case `number`:
        case `symbol`:
            return value;
        case `object`:
            if (value === null)
                return value;
            if (Array.isArray(value)) {
                return value.filter(v => v !== undefined)
                    .map(v => hackySanitize(v, removeUndef));
            }
            if (value instanceof Date)
                return value;
            return Object.fromEntries(
                Object.entries(value as Record<PropertyKey, unknown>)
                    .filter(([, e]) => !removeUndef || e !== undefined)
                    .map(([k, e]) => [k, hackySanitize(e, removeUndef)])
            );
    }

}
