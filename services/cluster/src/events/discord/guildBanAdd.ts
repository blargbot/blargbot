import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';
import Eris from 'eris';

export class DiscordGuildBanAddEventService extends DiscordEventService<'guildBanAdd'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildBanAdd', cluster.logger, (guild, user) => this.execute(guild, user));
    }

    public async execute(guild: Eris.Guild, user: Eris.User): Promise<void> {
        await Promise.all([
            this.cluster.moderation.bans.userBanned(guild, user),
            this.cluster.moderation.eventLog.userBanned(guild, user),
            this.cluster.database.guilds.clearVoteBans(guild.id, user.id)
        ]);
    }
}
