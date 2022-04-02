import { sleep } from '@blargbot/core/utils';
import { ChatLogIndicesTable, ChatLogsTable, DumpsTable, EventsTable, GuildsTable, SuggestionsTable, SuggestorsTable, TagsTable, TagVariablesTable, UsersTable, VarsTable } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';
import Airtable from 'airtable';
import { AirtableBase } from 'airtable/lib/airtable_base';
import AirtableError from 'airtable/lib/airtable_error';
import { auth as CassandraAuth, Client as Cassandra } from 'cassandra-driver';

import { PostgresDb, RethinkDb } from './clients';
import { DatabaseOptions } from './DatabaseOptions';
import { AirtableSuggestionsTable } from './stores/AirtableSuggestionsTable';
import { AirtableSuggestorsTable } from './stores/AirtableSuggestorsTable';
import { CassandraDbChatLogsTable } from './stores/CassandraDbChatLogsTable';
import { CassandraDbDumpsTable } from './stores/CassandraDbDumpsTable';
import { PostgresDbTagVariablesTable } from './stores/PostgresDbTagVariablesTable';
import { RethinkDbChatLogIndicesTable } from './stores/RethinkDbChatLogIndicesTable';
import { RethinkDbEventsTable } from './stores/RethinkDbEventsTable';
import { RethinkDbGuildsTable } from './stores/RethinkDbGuildsTable';
import { RethinkDbTagTable } from './stores/RethinkDbTagTable';
import { RethinkDbUsersTable } from './stores/RethinkDbUsersTable';
import { RethinkDbVarsTable } from './stores/RethinkDbVarsTable';

export class Database {
    readonly #rethinkDb: RethinkDb;
    readonly #cassandra: Cassandra;
    readonly #postgres: PostgresDb;
    readonly #guilds: RethinkDbGuildsTable;
    readonly #users: RethinkDbUsersTable;
    readonly #vars: RethinkDbVarsTable;
    readonly #events: RethinkDbEventsTable;
    readonly #tags: RethinkDbTagTable;
    readonly #logIndex: RethinkDbChatLogIndicesTable;
    readonly #chatlogs: CassandraDbChatLogsTable;
    readonly #dumps: CassandraDbDumpsTable;
    readonly #tagVariables: PostgresDbTagVariablesTable;
    readonly #airtable: AirtableBase;
    readonly #suggestors: AirtableSuggestorsTable;
    readonly #suggestions: AirtableSuggestionsTable;
    readonly #logger: Logger;

    public get guilds(): GuildsTable { return this.#guilds; }
    public get users(): UsersTable { return this.#users; }
    public get vars(): VarsTable { return this.#vars; }
    public get events(): EventsTable { return this.#events; }
    public get tags(): TagsTable { return this.#tags; }
    public get chatlogIndex(): ChatLogIndicesTable { return this.#logIndex; }
    public get chatlogs(): ChatLogsTable { return this.#chatlogs; }
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
        this.#guilds = new RethinkDbGuildsTable(this.#rethinkDb, this.#logger, options.shouldCacheGuild);
        this.#users = new RethinkDbUsersTable(this.#rethinkDb, this.#logger, options.shouldCacheUser);
        this.#vars = new RethinkDbVarsTable(this.#rethinkDb, this.#logger);
        this.#events = new RethinkDbEventsTable(this.#rethinkDb, this.#logger);
        this.#tags = new RethinkDbTagTable(this.#rethinkDb, this.#logger);
        this.#logIndex = new RethinkDbChatLogIndicesTable(this.#rethinkDb, this.#logger);
        this.#chatlogs = new CassandraDbChatLogsTable(this.#cassandra, this.#logger);
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
            this.#chatlogs.migrate(),
            this.#dumps.migrate()
        ]);
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
