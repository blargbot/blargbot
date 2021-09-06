import { Cluster } from '@cluster';
import { metrics } from '@core/Metrics';
import { DiscordEventService } from '@core/serviceTypes';
import { Guild } from 'discord.js';

export class DiscordGuildDeleteHandler extends DiscordEventService<'guildDelete'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildDelete', cluster.logger);
    }

    public async execute(guild: Guild): Promise<void> {
        metrics.guildGauge.dec();
        await this.cluster.util.postStats();
        await this.cluster.database.guilds.setActive(guild.id, false);
    }

}
