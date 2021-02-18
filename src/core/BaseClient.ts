import { Client as ErisClient, ClientOptions as ErisOptions } from 'eris';
import { PostgresDb } from './PostgresDb';
import { RethinkDb } from './RethinkDb';
import { Client as CassandraDb, auth as CassandraAuth } from 'cassandra-driver';
import { metrics } from './Metrics';
import { BaseUtilities } from './BaseUtilities';
import { BaseModuleLoader } from './BaseModuleLoader';

export class BaseClient {
    public readonly metrics: typeof metrics;
    public readonly util: BaseUtilities;
    public readonly postgres: PostgresDb;
    public readonly rethinkdb: RethinkDb;
    public readonly cassandra: CassandraDb;
    public readonly discord: ErisClient;

    public constructor(
        public readonly logger: CatLogger,
        public readonly config: Configuration,
        discordConfig: Omit<ErisOptions, 'restMode' | 'defaultImageFormat'>
    ) {
        this.metrics = metrics;
        this.util = new BaseUtilities(this);

        this.postgres = new PostgresDb(this.logger, {
            database: this.config.postgres.database,
            host: this.config.postgres.host,
            pass: this.config.postgres.pass,
            user: this.config.postgres.user,
            sequelize: this.config.sequelize
        });

        this.rethinkdb = new RethinkDb({
            database: this.config.db.database,
            password: this.config.db.password,
            user: this.config.db.user,
            host: this.config.db.host,
            port: this.config.db.port
        });

        this.cassandra = new CassandraDb({
            contactPoints: this.config.cassandra.contactPoints,
            keyspace: this.config.cassandra.keyspace,
            authProvider: new CassandraAuth.PlainTextAuthProvider(
                this.config.cassandra.username,
                this.config.cassandra.password
            )
        });

        this.discord = new ErisClient(this.config.discord.token, {
            restMode: true,
            defaultImageFormat: 'png',
            ...discordConfig
        });
    }

    public async start(): Promise<void> {
        await Promise.all([
            void this.postgres.authenticate().then(() => this.logger.init('postgres connected')), // TODO this takes too long
            this.rethinkdb.connect().then(() => this.logger.init('rethinkdb connected')),
            this.cassandra.connect().then(() => this.logger.init('cassandra connected')),
            this.discord.connect().then(() => this.logger.init('discord connected'))
        ]);
    }

    protected moduleStats<TModule, TKey extends string | number>(
        loader: BaseModuleLoader<TModule>,
        type: string,
        getKey: (module: TModule) => TKey,
        friendlyKey: (key: TKey) => string = k => k.toString()
    ): string {
        const items = [...loader.list()];
        const groups = new Map<TKey, number>();
        const result = [];
        for (const item of items) {
            const key = getKey(item);
            groups.set(key, (groups.get(key) || 0) + 1);
        }
        for (const [key, count] of groups)
            result.push(`${friendlyKey(key)}: ${count}`);
        return `${type}: ${items.length} [${result.join(' | ')}]`;
    }
}