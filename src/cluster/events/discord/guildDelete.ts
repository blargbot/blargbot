import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes';
import { PossiblyUncachedGuild } from 'eris';

export class DiscordGuildDeleteHandler extends DiscordEventService<`guildDelete`> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, `guildDelete`, cluster.logger, guild => this.execute(guild));
    }

    public async execute(guild: PossiblyUncachedGuild): Promise<void> {
        await this.cluster.guilds.guildLeft(guild.id);
        await this.cluster.util.postStats();
    }
}
