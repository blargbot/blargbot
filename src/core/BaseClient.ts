import { BaseUtilities } from '@core/BaseUtilities';
import { Database } from '@core/database';
import { Logger } from '@core/Logger';
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
            postgres: this.config.postgres,
            airtable: this.config.airtable
        });
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.database.connect().then(() => this.logger.init('database connected')),
            new Promise(resolve => this.discord.once('ready', resolve)),
            this.discord.login(this.config.discord.token).then(() => this.logger.init('discord connected'))
        ]);
        await this.discord.application.fetch();
        //? Caches home guild and bot user perms for logging channels
        const homeGuild = await this.discord.guilds.fetch(this.config.discord.guilds.home);
        await homeGuild.members.fetch(this.discord.user.id);
    }
}
