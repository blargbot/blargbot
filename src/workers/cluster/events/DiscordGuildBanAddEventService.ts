import { Guild, User } from 'eris';
import { Cluster } from '../Cluster';
import { DiscordEventService } from '../core';

export class DiscordGuildBanAddEventService extends DiscordEventService<'guildBanAdd'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildBanAdd', cluster.logger);
    }

    protected async execute(guild: Guild, user: User): Promise<void> {
        await Promise.all([
            this.cluster.moderation.bans.userBanned(guild, user),
            this.cluster.moderation.eventLog.userBanned(guild, user),
            this.cluster.database.guilds.clearVoteBans(guild.id, user.id)
        ]);
    }
}
