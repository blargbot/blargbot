import * as r from 'rethinkdb';

export interface Event {
    id: string;
    type: string;
    endtime: number;
    channel?: string;
    guild?: string;
    user?: string;
}

export interface StoredGuild {
    settings?: GuildSettings;
}

export interface GuildSettings {
    permoverride?: boolean;
    staffperms?: number;
    social?: boolean;
}

export interface StoredUser {
    dontdmerrors?: boolean;
}

export interface RethinkDbOptions {
    database: string;
    user: string;
    password: string;
    host: string;
    port: number;
}

export class RethinkDb {
    #connectionPromise?: Promise<r.Connection>
    #connection?: r.Connection
    readonly #options: RethinkDbOptions;

    constructor(options: RethinkDbOptions) {
        this.#options = options;
    }

    async getGuild(guildId: string) {
        return this.query(r => r.table('guild').get<StoredGuild>(guildId));
    }

    async getUser(userId: string) {
        return this.query(r => r.table('user').get<StoredUser>(userId));
    }

    async query<T = object>(query: (rethink: typeof r) => r.Operation<T>) {
        const connection = this.#connection ?? await this.connect();
        return await query(r).run(connection);
    }

    async * queryAll<T = object>(query: (rethink: typeof r) => r.Operation<r.Cursor>) {
        const cursor = await this.query(query);
        while (cursor.hasNext()) {
            yield <T>await cursor.next();
        }
    }

    epochTime(epoch: number) {
        return r.epochTime().add(epoch);
    }

    connect() {
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

        return this.#connectionPromise;
    }

    async disconnect() {
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
}