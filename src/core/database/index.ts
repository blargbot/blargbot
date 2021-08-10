import { Logger } from '@core/Logger';
import { ChatlogsTable, DatabaseOptions, DumpsTable, EventsTable, GuildTable, TagsTable, TagVariablesTable, UserTable, VarsTable } from '@core/types';
import { auth as CassandraAuth, Client as Cassandra } from 'cassandra-driver';
import { Client as Discord } from 'discord.js';

import { PostgresDb, RethinkDb } from './base';
import { CassandraDbChatlogTable } from './CassandraDbChatlogTable';
import { CassandraDbDumpsTable } from './CassandraDbDumpsTable';
import { PostgresDbTagVariablesTable } from './PostgresDbTagVariablesTable';
import { RethinkDbEventsTable } from './RethinkDbEventsTable';
import { RethinkDbGuildTable } from './RethinkDbGuildTable';
import { RethinkDbTagTable } from './RethinkDbTagTable';
import { RethinkDbUserTable } from './RethinkDbUserTable';
import { RethinkDbVarsTable } from './RethinkDbVarsTable';

export class Database {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #rethinkDb: RethinkDb;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cassandra: Cassandra;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #postgres: PostgresDb;
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
    readonly #chatlogs: CassandraDbChatlogTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #dumps: CassandraDbDumpsTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #tagVariables: PostgresDbTagVariablesTable;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #logger: Logger;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #discord: Discord<true>;

    public get guilds(): GuildTable { return this.#guilds; }
    public get users(): UserTable { return this.#users; }
    public get vars(): VarsTable { return this.#vars; }
    public get events(): EventsTable { return this.#events; }
    public get tags(): TagsTable { return this.#tags; }
    public get chatlogs(): ChatlogsTable { return this.#chatlogs; }
    public get dumps(): DumpsTable { return this.#dumps; }
    public get tagVariables(): TagVariablesTable { return this.#tagVariables; }

    public constructor(options: DatabaseOptions) {
        this.#rethinkDb = new RethinkDb(options.rethinkDb);
        this.#postgres = new PostgresDb(options.logger, options.postgres);
        this.#cassandra = new Cassandra({
            contactPoints: [...options.cassandra.contactPoints],
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
        this.#chatlogs = new CassandraDbChatlogTable(this.#cassandra, this.#logger);
        this.#dumps = new CassandraDbDumpsTable(this.#cassandra, this.#logger);
        this.#tagVariables = new PostgresDbTagVariablesTable(this.#postgres, this.#logger);
    }

    public async connect(): Promise<void> {
        this.connect = () => Promise.resolve();

        await Promise.all([
            this.#rethinkDb.connect().then(() => this.#logger.init('rethinkdb connected')),
            this.#cassandra.connect().then(() => this.#logger.init('cassandra connected')),
            this.#postgres.authenticate().then(() => this.#logger.init('postgresdb connected'))
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

        void this.#guilds.watchChanges(id => this.#discord.guilds.cache.get(id) !== undefined);
        void this.#users.watchChanges(id => this.#discord.users.cache.get(id) !== undefined);
    }
}
