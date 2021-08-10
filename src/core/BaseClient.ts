import { BaseUtilities } from '@core/BaseUtilities';
import { Database } from '@core/database';
import { Logger } from '@core/Logger';
import { BaseModuleLoader } from '@core/modules';
import { Client as Discord, ClientOptions as DiscordOptions } from 'discord.js';

export class BaseClient {
    public readonly util: BaseUtilities;
    public readonly database: Database;
    public readonly discord: Discord<true>;

    public constructor(
        public readonly logger: Logger,
        public readonly config: Configuration,
        discordConfig: DiscordOptions
    ) {
        this.util = new BaseUtilities(this);

        this.discord = new Discord(discordConfig);

        this.database = new Database({
            logger: this.logger,
            discord: this.discord,
            rethinkDb: this.config.rethink,
            cassandra: this.config.cassandra,
            postgres: this.config.postgres
        });
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.database.connect().then(() => this.logger.init('database connected')),
            new Promise(resolve => this.discord.once('ready', resolve)),
            this.discord.login(this.config.discord.token).then(() => this.logger.init('discord connected'))
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
            groups.set(key, (groups.get(key) ?? 0) + 1);
        }
        for (const [key, count] of groups)
            result.push(`${friendlyKey(key)}: ${count}`);
        return `${type}: ${items.length} [${result.join(' | ')}]`;
    }
}
