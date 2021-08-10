import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { GuildBan } from 'discord.js';

export class DiscordGuildBanAddEventService extends DiscordEventService<'guildBanAdd'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildBanAdd', cluster.logger);
    }

    protected async execute(ban: GuildBan): Promise<void> {
        await Promise.all([
            this.cluster.moderation.bans.userBanned(ban.guild, ban.user),
            this.cluster.moderation.eventLog.userBanned(ban.guild, ban.user),
            this.cluster.database.guilds.clearVoteBans(ban.guild.id, ban.user.id)
        ]);
    }
}
