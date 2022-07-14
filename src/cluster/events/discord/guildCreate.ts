import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes';
import { Guild } from 'eris';

export class DiscordGuildCreateHandler extends DiscordEventService<'guildCreate'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildCreate', cluster.logger, (guild) => this.execute(guild));
    }

    public async execute(guild: Guild): Promise<void> {
        await this.cluster.guilds.guildJoined(guild);
        await this.cluster.util.postStats();
    }

}
