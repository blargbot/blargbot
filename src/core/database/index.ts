import { Logger } from '@blargbot/core/Logger';
import { ChatlogIndexTable, ChatlogsTable, DatabaseOptions, DumpsTable, EventsTable, GuildTable, SuggestionsTable, SuggestorsTable, TagsTable, TagVariablesTable, UserTable, VarsTable } from '@blargbot/core/types';
import { sleep } from '@blargbot/core/utils';
import Airtable from 'airtable';
import { AirtableBase } from 'airtable/lib/airtable_base';
import AirtableError from 'airtable/lib/airtable_error';
import { auth as CassandraAuth, Client as Cassandra } from 'cassandra-driver';
import { Client as Discord } from 'eris';

import { AirtableSuggestionsTable } from './AirtableSuggestionsTable';
import { AirtableSuggestorsTable } from './AirtableSuggestorsTable';
import { PostgresDb, RethinkDb } from './base';
import { CassandraDbChatlogTable } from './CassandraDbChatlogTable';
import { CassandraDbDumpsTable } from './CassandraDbDumpsTable';
import { PostgresDbTagVariablesTable } from './PostgresDbTagVariablesTable';
import { RethinkDbEventsTable } from './RethinkDbEventsTable';
import { RethinkDbGuildTable } from './RethinkDbGuildTable';
import { RethinkDbLogsTable } from './RethinkDbLogsTable';
import { RethinkDbTagTable } from './RethinkDbTagTable';
import { RethinkDbUserTable } from './RethinkDbUserTable';
import { RethinkDbVarsTable } from './RethinkDbVarsTable';

export class Database {
    readonly #rethinkDb: RethinkDb;
    readonly #cassandra: Cassandra;
    readonly #postgres: PostgresDb;
    readonly #guilds: RethinkDbGuildTable;
    readonly #users: RethinkDbUserTable;
    readonly #vars: RethinkDbVarsTable;
    readonly #events: RethinkDbEventsTable;
    readonly #tags: RethinkDbTagTable;
    readonly #logIndex: RethinkDbLogsTable;
    readonly #chatlogs: CassandraDbChatlogTable;
    readonly #dumps: CassandraDbDumpsTable;
    readonly #tagVariables: PostgresDbTagVariablesTable;
    readonly #airtable: AirtableBase;
    readonly #suggestors: AirtableSuggestorsTable;
    readonly #suggestions: AirtableSuggestionsTable;
    readonly #logger: Logger;
    readonly #discord: Discord;

    public get guilds(): GuildTable { return this.#guilds; }
    public get users(): UserTable { return this.#users; }
    public get vars(): VarsTable { return this.#vars; }
    public get events(): EventsTable { return this.#events; }
    public get tags(): TagsTable { return this.#tags; }
    public get chatlogIndex(): ChatlogIndexTable { return this.#logIndex; }
    public get chatlogs(): ChatlogsTable { return this.#chatlogs; }
    public get dumps(): DumpsTable { return this.#dumps; }
    public get tagVariables(): TagVariablesTable { return this.#tagVariables; }
    public get suggestors(): SuggestorsTable { return this.#suggestors; }
    public get suggestions(): SuggestionsTable { return this.#suggestions; }

    public constructor(options: DatabaseOptions) {
        this.#airtable = new Airtable({
            apiKey: options.airtable.key
        }).base(options.airtable.base);
        this.#rethinkDb = new RethinkDb(options.rethink);
        this.#postgres = new PostgresDb(options.logger, options.postgres);
        this.#cassandra = new Cassandra({
            localDataCenter: 'datacenter1',
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
        this.#logIndex = new RethinkDbLogsTable(this.#rethinkDb, this.#logger);
        this.#chatlogs = new CassandraDbChatlogTable(this.#cassandra, this.#logger);
        this.#dumps = new CassandraDbDumpsTable(this.#cassandra, this.#logger);
        this.#tagVariables = new PostgresDbTagVariablesTable(this.#postgres, this.#logger);
        this.#suggestors = new AirtableSuggestorsTable(this.#airtable, this.#logger);
        this.#suggestions = new AirtableSuggestionsTable(this.#airtable, this.#logger);
    }

    public async connect(): Promise<void> {
        this.connect = () => Promise.resolve();

        await Promise.all([
            this.retryConnect('rethinkDb', () => this.#rethinkDb.connect(), 5000, 10),
            this.retryConnect('cassandra', () => this.#cassandra.connect(), 5000, 10),
            this.retryConnect('postgresdb', () => this.#postgres.connect(), 5000, 10),
            this.retryConnect('airtable', async () => {
                try {
                    await this.#airtable.makeRequest({ path: '/_' });
                } catch (err: unknown) {
                    if (err instanceof AirtableError && err.message.startsWith('Could not find table _ in application'))
                        return;
                    throw err;
                }
            }, 5000, 10)
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

        this.#guilds.watchChanges(id => this.#discord.guilds.get(id) !== undefined);
        this.#users.watchChanges(id => this.#discord.users.get(id) !== undefined);
    }

    private async retryConnect(dbName: string, connect: () => Promise<unknown>, intervalMs: number, maxAttempts = Infinity): Promise<void> {
        let attempt = 0;
        while (attempt++ < maxAttempts) {
            try {
                await connect();
                this.#logger.init(dbName, 'connected on attempt', attempt);
                break;
            } catch (err: unknown) {
                this.#logger.error('Failed to connect to', dbName, 'on attempt', attempt, '. Retrying in', intervalMs, 'ms', err);
                await sleep(intervalMs);
            }
        }
    }
}
