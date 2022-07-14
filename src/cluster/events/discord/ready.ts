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
        await Promise.all([
            this.cluster.util.postStats(),
            ...this.cluster.discord.guilds.map(guild => this.cluster.guilds.guildJoined(guild))
        ]);
    }
}
