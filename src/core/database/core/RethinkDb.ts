import * as r from 'rethinkdb';
import { RethinkDbOptions } from '../types';

export type r = Parameters<Query<unknown>>[0];

export type Query<T> = (rethink: typeof r) => r.Operation<T>;
export type TableQuery<T> = (table: r.Table, rethink: typeof r) => r.Operation<T>;
export type Cursor = r.Cursor;

export class RethinkDb {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #connectionPromise?: Promise<r.Connection>
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #connection?: r.Connection
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #options: RethinkDbOptions;

    public constructor(options: RethinkDbOptions) {
        this.#options = options;
    }

    public async query<T>(query: Query<T>): Promise<T>
    public async query<T>(query: Query<T | undefined>): Promise<T | undefined>
    public async query<T>(query: Query<T | undefined>): Promise<T | undefined> {
        const connection = this.#connection ?? await this.connect();
        return await query(r)?.run(connection);
    }

    public async queryAll<T>(query: Query<r.Cursor>): Promise<T[]> {
        const stream = this.stream<T>(query);
        const result = [];
        for await (const item of stream)
            result.push(item);
        return result;
    }

    public async * stream<T>(query: Query<r.Cursor>): AsyncIterableIterator<T> {
        const cursor = await this.query(query);
        while (true) {
            try {
                yield <T>await cursor.next();
            } catch (err) {
                if (err && err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.')
                    break;
                throw err;
            }
        }
    }

    public async connect(): Promise<r.Connection> {
        if (!this.#connectionPromise) {
            this.#connectionPromise = r.connect({
                host: this.#options.host,
                db: this.#options.database,
                password: this.#options.password,
                user: this.#options.user,
                port: this.#options.port,
                timeout: 10000
            }).then(conn => this.#connection = conn);
        }

        return await this.#connectionPromise;
    }

    public async disconnect(): Promise<void> {
        if (!this.#connection) {
            if (!this.#connectionPromise) {
                return;
            }

            await this.#connectionPromise;
        }

        if (this.#connection) {
            await this.#connection.close();
            this.#connection = undefined;
            this.#connectionPromise = undefined;
        }
    }

    public epochTime(time: number): r.Expression<r.Time> {
        return r.epochTime(time);
    }
}