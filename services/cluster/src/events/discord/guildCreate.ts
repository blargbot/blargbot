import type { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';
import type * as Eris from 'eris';

export class DiscordGuildCreateHandler extends DiscordEventService<'guildCreate'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildCreate', cluster.logger, (guild) => this.execute(guild));
    }

    public async execute(guild: Eris.Guild): Promise<void> {
        await this.cluster.guilds.guildLoaded(guild);
        await this.cluster.util.postStats();
    }

}
