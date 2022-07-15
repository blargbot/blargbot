import { Cluster } from '@blargbot/cluster';
import { metrics } from '@blargbot/core/Metrics';
import { DiscordEventService } from '@blargbot/core/serviceTypes';

export class DiscordGuildDeleteHandler extends DiscordEventService<'guildDelete'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildDelete', cluster.logger, async (guild) => {
            metrics.guildGauge.dec();
            await this.cluster.util.postStats();
            await this.cluster.database.guilds.setActive(guild.id, false);
        });
    }
}
