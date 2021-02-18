import { RethinkDb } from './core/RethinkDb';
import { Client as ErisClient } from 'eris';
import { RethinkTableMap, UpdateRequest, DatabaseOptions, GuildTable, UserTable, StoredEvent, StoredTag, GetStoredVar, KnownStoredVars } from './types';
import { RethinkDbGuildTable } from './RethinkDbGuildTable';
import { RethinkDbUserTable } from './RethinkDbUserTable';
import { r } from './core/RethinkDb';

export * from './types';

export class Database {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #r: RethinkDb;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #guilds: RethinkDbGuildTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #users: RethinkDbUserTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #logger: CatLogger;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #discord: ErisClient;

    public get guilds(): GuildTable { return this.#guilds; }
    public get users(): UserTable { return this.#users; }

    public constructor(options: DatabaseOptions) {
        this.#r = new RethinkDb(options.rethinkDb);
        this.#logger = options.logger;
        this.#discord = options.discord;
        this.#guilds = new RethinkDbGuildTable(this.#r, this.#logger);
        this.#users = new RethinkDbUserTable(this.#r, this.#logger);
    }

    public async connect(): Promise<void> {
        this.connect = () => Promise.resolve();
        await this.#r.connect()
            .then(() => {
                this.#logger.init('rethinkdb connected');
                void this.#guilds.watchChanges(id => this.#discord.guilds.get(id) !== undefined);
                void this.#users.watchChanges(id => this.#discord.users.get(id) !== undefined);
                void this.#guilds.migrate();
            });
    }

    public async getVariable<K extends KnownStoredVars['varname']>(key: K): Promise<DeepReadOnly<GetStoredVar<K>> | undefined> {
        return <GetStoredVar<K> | undefined>await this._rethinkGet('vars', key);
    }
    public async setVariable<K extends KnownStoredVars['varname']>(value: GetStoredVar<K>): Promise<boolean> {
        return await this._rethinkUpdate('vars', value.varname, r => <UpdateRequest<GetStoredVar<K>>>r.literal(value))
            || await this._rethinkInsert('vars', value);
    }
    public async deleteVariable<K extends KnownStoredVars['varname']>(key: K): Promise<boolean> {
        return await this._rethinkDelete('vars', key);
    }

    public async getTag(tagName: string): Promise<DeepReadOnly<StoredTag> | undefined> {
        return await this._rethinkGet('tag', tagName);
    }

    public async incrementTagUses(tagName: string, count = 1): Promise<boolean> {
        return await this._rethinkUpdate('tag', tagName, r => ({
            uses: r.row<number>('uses').default(0).add(count),
            lastuse: new Date()
        }));
    }

    public async addEvent(event: Omit<StoredEvent, 'id'>): Promise<boolean> {
        return await this._rethinkInsert('events', event, true);
    }

    public async removeEvent(eventId: string): Promise<boolean> {
        return await this._rethinkDelete('events', eventId);
    }

    public async removeEvents(filter: Partial<StoredEvent>): Promise<boolean> {
        return await this._rethinkDelete('events', filter);
    }

    public async getEvents({ before, after = new Date(0) }: { before: Date, after?: Date }): Promise<StoredEvent[]> {
        return await this.#r.queryAll(r => r.table('events').between(after, before, { index: 'endtime' }));
    }

    private async _rethinkGet<K extends keyof RethinkTableMap>(
        table: K,
        key: string
    ): Promise<RethinkTableMap[K] | undefined> {
        return await this.#r.query(r => r.table(table).get<RethinkTableMap[K]>(key)) ?? undefined;
    }

    private async _rethinkInsert<K extends keyof RethinkTableMap>(table: K, value: RethinkTableMap[K], applyChanges = false): Promise<boolean> {
        const result = await this.#r.query(r => r.table(table).insert(value, { returnChanges: applyChanges }));
        if (applyChanges && result.changes?.[0]?.new_val)
            Object.apply(value, result.changes?.[0].new_val);
        return result.inserted + result.unchanged > 0;
    }

    private async _rethinkUpdate<K extends keyof RethinkTableMap>(
        table: K,
        key: string,
        value: UpdateRequest<RethinkTableMap[K]> | ((r: r) => UpdateRequest<RethinkTableMap[K]>)
    ): Promise<boolean> {
        const getter = typeof value === 'function' ? value : () => value;
        const result = await this.#r.query(r => r.table(table).get(key).update(getter(r)));
        return result.replaced + result.unchanged > 0;
    }

    private async _rethinkDelete<K extends keyof RethinkTableMap>(
        table: K,
        key: string | Partial<RethinkTableMap[K]>
    ): Promise<boolean> {
        const result = typeof key === 'string'
            ? await this.#r.query(r => r.table(table).get(key).delete())
            : await this.#r.query(r => r.table(table).delete(key));
        return result.deleted > 0;
    }
}