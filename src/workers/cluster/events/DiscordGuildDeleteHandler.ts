import { Guild } from 'eris';
import { Cluster } from '../Cluster';
import { DiscordEventService, metrics } from '../core';

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
