import * as r from 'rethinkdb';
import { Query, Expression, Cursor, Connection, Time } from 'rethinkdb';
import { RethinkDbOptions } from '../types';

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
        return await query(r).run(connection);
    }

    public async queryAll<T>(query: Query<Cursor>): Promise<T[]> {
        const stream = this.stream<T>(query);
        const result = [];
        for await (const item of stream)
            result.push(item);
        return result;
    }

    public async * stream<T>(query: Query<Cursor>): AsyncIterableIterator<T> {
        const cursor = await this.query(query);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
            try {
                yield <T>await cursor.next();
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.')
                    break;
                throw err;
            }
        }
    }

    public async connect(): Promise<Connection> {
        if (this.#connectionPromise === undefined) {
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
        if (this.#connection === undefined) {
            if (this.#connectionPromise === undefined) {
                return;
            }

            await this.#connectionPromise;
        }

        if (this.#connection !== undefined) {
            await this.#connection.close();
            this.#connection = undefined;
            this.#connectionPromise = undefined;
        }
    }

    public epochTime(time: number): Expression<Time> {
        return r.epochTime(time);
    }
}
