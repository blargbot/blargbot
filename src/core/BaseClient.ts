import { Client as ErisClient, ClientOptions as ErisOptions } from 'eris';
import { BaseUtilities } from './BaseUtilities';
import { BaseModuleLoader } from './BaseModuleLoader';
import { Database } from './database';
import { Logger } from './Logger';

export class BaseClient {
    public readonly util: BaseUtilities;
    public readonly database: Database;
    public readonly discord: ErisClient;

    public constructor(
        public readonly logger: Logger,
        public readonly config: Configuration,
        discordConfig: Omit<ErisOptions, 'restMode' | 'defaultImageFormat'>
    ) {
        this.util = new BaseUtilities(this);

        this.discord = new ErisClient(this.config.discord.token, {
            restMode: true,
            defaultImageFormat: 'png',
            ...discordConfig
        });

        this.database = new Database({
            logger: this.logger,
            discord: this.discord,
            rethinkDb: {
                database: this.config.db.database,
                password: this.config.db.password,
                user: this.config.db.user,
                host: this.config.db.host,
                port: this.config.db.port
            },
            cassandra: this.config.cassandra,
            postgres: {
                ...this.config.postgres,
                sequelize: this.config.sequelize
            }
        });
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.database.connect().then(() => this.logger.init('database connected')),
            new Promise(resolve => this.discord.once('ready', resolve)),
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