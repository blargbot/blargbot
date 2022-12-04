import type { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';
import type * as Eris from 'eris';

export class DiscordGuildDeleteHandler extends DiscordEventService<'guildDelete'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildDelete', cluster.logger, guild => this.execute(guild));
    }

    public async execute(guild: Eris.PossiblyUncachedGuild): Promise<void> {
        await this.cluster.guilds.guildLeft(guild.id);
        await this.cluster.util.postStats();
    }
}
