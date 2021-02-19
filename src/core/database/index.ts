import { RethinkDb } from './core/RethinkDb';
import { Client as Cassandra, auth as CassandraAuth } from 'cassandra-driver';
import { Client as ErisClient } from 'eris';
import { DatabaseOptions, GuildTable, UserTable, VarsTable, EventsTable, TagsTable, ChatlogsTable, DumpsTable } from './types';
import { RethinkDbGuildTable } from './RethinkDbGuildTable';
import { RethinkDbUserTable } from './RethinkDbUserTable';
import { RethinkDbVarsTable } from './RethinkDbVarsTable';
import { RethinkDbEventsTable } from './RethinkDbEventsTable';
import { RethinkDbTagTable } from './RethinkDbTagTable';
import { CassandraChatlogDbTable } from './CassandraChatlogDbTable';
import { CassandraDumpsDbTable } from './CassandraDumpsDbTable';

export * from './types';

export class Database {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #rethinkDb: RethinkDb;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cassandra: Cassandra;
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
    readonly #chatlogs: CassandraChatlogDbTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #dumps: CassandraDumpsDbTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #logger: CatLogger;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #discord: ErisClient;

    public get guilds(): GuildTable { return this.#guilds; }
    public get users(): UserTable { return this.#users; }
    public get vars(): VarsTable { return this.#vars; }
    public get events(): EventsTable { return this.#events; }
    public get tags(): TagsTable { return this.#tags; }
    public get chatlogs(): ChatlogsTable { return this.#chatlogs; }
    public get dumps(): DumpsTable { return this.#dumps; }

    public constructor(options: DatabaseOptions) {
        this.#rethinkDb = new RethinkDb(options.rethinkDb);
        this.#cassandra = new Cassandra({
            contactPoints: options.cassandra.contactPoints,
            keyspace: options.cassandra.keyspace,
            authProvider: new CassandraAuth.PlainTextAuthProvider(
                options.cassandra.username,
                options.cassandra.password
            )
        });
        this.#logger = options.logger;
        this.#discord = options.discord;
        this.#guilds = new RethinkDbGuildTable(this.#rethinkDb, this.#logger);
        this.#users = new RethinkDbUserTable(this.#rethinkDb, this.#logger);
        this.#vars = new RethinkDbVarsTable(this.#rethinkDb, this.#logger);
        this.#events = new RethinkDbEventsTable(this.#rethinkDb, this.#logger);
        this.#tags = new RethinkDbTagTable(this.#rethinkDb, this.#logger);
        this.#chatlogs = new CassandraChatlogDbTable(this.#cassandra, this.#logger);
        this.#dumps = new CassandraDumpsDbTable(this.#cassandra, this.#logger);
    }

    public async connect(): Promise<void> {
        this.connect = () => Promise.resolve();
        await Promise.all([
            this.#rethinkDb.connect().then(() => this.#logger.init('rethinkdb connected')),
            this.#cassandra.connect().then(() => this.#logger.init('cassandra connected'))
        ]);
        await Promise.all([
            this.#guilds.migrate(),
            this.#users.migrate(),
            this.#vars.migrate(),
            this.#events.migrate(),
            this.#tags.migrate(),
            this.#chatlogs.migrate(),
            this.#dumps.migrate()
        ]);
        void this.#guilds.watchChanges(id => this.#discord.guilds.get(id) !== undefined);
        void this.#users.watchChanges(id => this.#discord.users.get(id) !== undefined);
    }
}