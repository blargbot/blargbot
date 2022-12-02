import { sleep } from '@blargbot/core/utils/index.js';
import { BotVariableStore, ChatLogIndexStore, ChatLogStore, DumpStore, EventStore, GuildStore, SuggesterStore, SuggestionStore, TagStore, TagVariableStore, UserStore } from '@blargbot/domain/stores/index.js';
import { Logger } from '@blargbot/logger';
import Airtable from 'airtable';
import { AirtableBase } from 'airtable/lib/airtable_base.js';
import { auth as CassandraAuth, Client as Cassandra } from 'cassandra-driver';

import { PostgresDb, RethinkDb } from './clients/index.js';
import { DatabaseOptions } from './DatabaseOptions.js';
import { AirtableSuggesterStore } from './stores/AirtableSuggesterStore.js';
import { AirtableSuggestionStore } from './stores/AirtableSuggestionStore.js';
import { CassandraDbChatLogStore } from './stores/CassandraDbChatLogStore.js';
import { CassandraDbDumpStore } from './stores/CassandraDbDumpStore.js';
import { PostgresDbTagVariableStore } from './stores/PostgresDbTagVariableStore.js';
import { RethinkDbBotVariableStore } from './stores/RethinkDbBotVariableStore.js';
import { RethinkDbChatLogIndexStore } from './stores/RethinkDbChatLogIndexStore.js';
import { RethinkDbEventStore } from './stores/RethinkDbEventStore.js';
import { RethinkDbGuildStore } from './stores/RethinkDbGuildStore.js';
import { RethinkDbTagStore } from './stores/RethinkDbTagStore.js';
import { RethinkDbUserStore } from './stores/RethinkDbUserStore.js';

export class Database {
    readonly #rethink: RethinkDb;
    readonly #cassandra: Cassandra;
    readonly #postgres: PostgresDb;
    readonly #guilds: RethinkDbGuildStore;
    readonly #users: RethinkDbUserStore;
    readonly #vars: RethinkDbBotVariableStore;
    readonly #events: RethinkDbEventStore;
    readonly #tags: RethinkDbTagStore;
    readonly #logIndex: RethinkDbChatLogIndexStore;
    readonly #chatlogs: CassandraDbChatLogStore;
    readonly #dumps: CassandraDbDumpStore;
    readonly #tagVariables: PostgresDbTagVariableStore;
    readonly #airtable: AirtableBase;
    readonly #suggestors: AirtableSuggesterStore;
    readonly #suggestions: AirtableSuggestionStore;
    readonly #logger: Logger;

    public get guilds(): GuildStore { return this.#guilds; }
    public get users(): UserStore { return this.#users; }
    public get vars(): BotVariableStore { return this.#vars; }
    public get events(): EventStore { return this.#events; }
    public get tags(): TagStore { return this.#tags; }
    public get chatlogIndex(): ChatLogIndexStore { return this.#logIndex; }
    public get chatlogs(): ChatLogStore { return this.#chatlogs; }
    public get dumps(): DumpStore { return this.#dumps; }
    public get tagVariables(): TagVariableStore { return this.#tagVariables; }
    public get suggesters(): SuggesterStore { return this.#suggestors; }
    public get suggestions(): SuggestionStore { return this.#suggestions; }

    public constructor(options: DatabaseOptions) {
        this.#airtable = new Airtable({
            apiKey: options.airtable.key
        }).base(options.airtable.base);
        this.#rethink = new RethinkDb(options.rethink);
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
        this.#guilds = new RethinkDbGuildStore(this.#rethink, this.#logger, options.shouldCacheGuild);
        this.#users = new RethinkDbUserStore(this.#rethink, this.#logger, options.shouldCacheUser);
        this.#vars = new RethinkDbBotVariableStore(this.#rethink, this.#logger);
        this.#events = new RethinkDbEventStore(this.#rethink, this.#logger);
        this.#tags = new RethinkDbTagStore(this.#rethink, this.#logger);
        this.#logIndex = new RethinkDbChatLogIndexStore(this.#rethink, this.#logger);
        this.#chatlogs = new CassandraDbChatLogStore(this.#cassandra, this.#logger);
        this.#dumps = new CassandraDbDumpStore(this.#cassandra, this.#logger);
        this.#tagVariables = new PostgresDbTagVariableStore(this.#postgres, this.#logger);
        this.#suggestors = new AirtableSuggesterStore(this.#airtable, this.#logger);
        this.#suggestions = new AirtableSuggestionStore(this.#airtable, this.#logger);
    }

    public async connect(): Promise<void> {
        this.connect = () => Promise.resolve();

        await Promise.all([
            this.#retryConnect('rethinkDb', () => this.#rethink.connect(), 5000, 10),
            this.#retryConnect('cassandra', () => this.#cassandra.connect(), 5000, 10),
            this.#retryConnect('postgresdb', () => this.#postgres.connect(), 5000, 10)
        ]);

        await Promise.all([
            this.#guilds.migrate(),
            this.#chatlogs.migrate(),
            this.#dumps.migrate()
        ]);
    }

    async #retryConnect(dbName: string, connect: () => Promise<unknown>, intervalMs: number, maxAttempts = Infinity): Promise<void> {
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
