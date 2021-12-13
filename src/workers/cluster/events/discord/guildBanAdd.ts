import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { Guild, User } from 'eris';

export class DiscordGuildBanAddEventService extends DiscordEventService<'guildBanAdd'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildBanAdd', cluster.logger, (guild, user) => this.execute(guild, user));
    }

    public async execute(guild: Guild, user: User): Promise<void> {
        await Promise.all([
            this.cluster.moderation.bans.userBanned(guild, user),
            this.cluster.moderation.eventLog.userBanned(guild, user),
            this.cluster.database.guilds.clearVoteBans(guild.id, user.id)
        ]);
    }
}
