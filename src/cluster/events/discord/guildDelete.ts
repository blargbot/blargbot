import { Cluster } from '@cluster';
import { metrics } from '@core/Metrics';
import { DiscordEventService } from '@core/serviceTypes';

export class DiscordGuildDeleteHandler extends DiscordEventService<'guildDelete'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildDelete', cluster.logger, async (guild) => {
            metrics.guildGauge.dec();
            await this.cluster.util.postStats();
            await this.cluster.database.guilds.setActive(guild.id, false);
        });
    }
}
