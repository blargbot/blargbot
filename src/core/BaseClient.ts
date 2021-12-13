import { BaseUtilities } from '@core/BaseUtilities';
import { Database } from '@core/database';
import { Logger } from '@core/Logger';
import { Client as Discord, ClientOptions as DiscordOptions, OAuthTeamMemberState } from 'eris';

import { Configuration } from './Configuration';
import { getRange } from './utils';

export class BaseClient {
    #owners: readonly string[] = [];
    public readonly util: BaseUtilities;
    public readonly database: Database;
    public readonly discord: Discord;
    public get ownerIds(): readonly string[] { return this.#owners; }

    public constructor(
        public readonly logger: Logger,
        public readonly config: Configuration,
        discordConfig: DiscordOptions
    ) {
        this.util = new BaseUtilities(this);

        this.discord = new Discord(this.config.discord.token, discordConfig);

        this.database = new Database({
            logger: this.logger,
            discord: this.discord,
            rethink: this.config.rethink,
            cassandra: this.config.cassandra,
            postgres: this.config.postgres,
            airtable: this.config.airtable
        });
    }

    public async start(): Promise<void> {
        const promises = [
            this.database.connect().then(() => this.logger.init('database connected'))
        ];

        if (this.discord.options.maxShards !== undefined) {
            const shards = getRange(this.discord.options.firstShardID ?? 0, this.discord.options.lastShardID ?? 0);
            const remainingShards = new Set(shards);

            promises.push(
                new Promise(resolve => this.discord.once('ready', resolve)).then(() => this.logger.init('discord connected')),
                createShardReadyWaiter(this.discord, remainingShards, this.logger),
                this.discord.connect()
            );
        }

        await Promise.all(promises);

        const application = await this.discord.getOAuthApplication();
        this.#owners = application.team?.members.filter(m => m.membership_state === OAuthTeamMemberState.ACCEPTED).map(m => m.user.id)
            ?? [application.owner.id];
    }
}

function createShardReadyWaiter(discord: Discord, shards: Set<number>, logger: Logger): Promise<void> {
    return new Promise(res => {
        function shardReady(shardId: number): void {
            if (!shards.delete(shardId))
                return;

            if (shards.size > 0)
                return logger.info('Shard', shardId, 'is ready. Remaining shards: [', ...[...shards].flatMap(s => [s, ',']).slice(0, -1), ']');

            discord.off('shardReady', shardReady);
            logger.info('Shard', shardId, 'is ready. All shards ready');
            res();
        }

        discord.on('shardReady', shardReady);
    });
}
