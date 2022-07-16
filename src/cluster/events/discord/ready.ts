import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes';

export class DiscordReadyHandler extends DiscordEventService<'ready'> {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'ready', cluster.logger, () => this.execute());
    }

    public async execute(): Promise<void> {
        this.logger.init(`Ready! Logged in as ${this.cluster.discord.user.username}#${this.cluster.discord.user.discriminator}`);
        for (const guild of this.cluster.discord.guilds.values()) {
            try {
                await this.cluster.guilds.guildLoaded(guild);
            } catch (err: unknown) {
                this.cluster.logger.error('Failed to load guild', guild.id, 'into db', err);
            }
        }
        await this.cluster.util.postStats();
    }
}
