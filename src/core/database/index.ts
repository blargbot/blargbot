import { RethinkDb } from './core/RethinkDb';
import { Client as ErisClient } from 'eris';
import { DatabaseOptions, GuildTable, UserTable, VarsTable, EventsTable, TagsTable } from './types';
import { RethinkDbGuildTable } from './RethinkDbGuildTable';
import { RethinkDbUserTable } from './RethinkDbUserTable';
import { RethinkDbVarsTable } from './RethinkDbVarsTable';
import { RethinkDbEventsTable } from './RethinkDbEventsTable';
import { RethinkDbTagTable } from './RethinkDbTagTable';

export * from './types';

export class Database {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #rethinkDb: RethinkDb;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #guilds: RethinkDbGuildTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #users: RethinkDbUserTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #vars: RethinkDbVarsTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #events: RethinkDbEventsTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #tags: RethinkDbTagTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #logger: CatLogger;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #discord: ErisClient;

    public get guilds(): GuildTable { return this.#guilds; }
    public get users(): UserTable { return this.#users; }
    public get vars(): VarsTable { return this.#vars; }
    public get events(): EventsTable { return this.#events; }
    public get tags(): TagsTable { return this.#tags; }

    public constructor(options: DatabaseOptions) {
        this.#rethinkDb = new RethinkDb(options.rethinkDb);
        this.#logger = options.logger;
        this.#discord = options.discord;
        this.#guilds = new RethinkDbGuildTable(this.#rethinkDb, this.#logger);
        this.#users = new RethinkDbUserTable(this.#rethinkDb, this.#logger);
        this.#vars = new RethinkDbVarsTable(this.#rethinkDb, this.#logger);
        this.#events = new RethinkDbEventsTable(this.#rethinkDb, this.#logger);
        this.#tags = new RethinkDbTagTable(this.#rethinkDb, this.#logger);
    }

    public async connect(): Promise<void> {
        this.connect = () => Promise.resolve();
        await this.#rethinkDb.connect();
        await Promise.all([
            this.#guilds.migrate(),
            this.#users.migrate(),
            this.#vars.migrate(),
            this.#events.migrate(),
            this.#tags.migrate(),
        ]);
        this.#logger.init('rethinkdb connected');
        void this.#guilds.watchChanges(id => this.#discord.guilds.get(id) !== undefined);
        void this.#users.watchChanges(id => this.#discord.users.get(id) !== undefined);
    }
}