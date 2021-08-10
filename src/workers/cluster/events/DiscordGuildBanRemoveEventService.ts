import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { GuildBan } from 'discord.js';

export class DiscordGuildBanRemoveEventService extends DiscordEventService<'guildBanRemove'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildBanRemove', cluster.logger);
    }

    protected async execute(ban: GuildBan): Promise<void> {
        await Promise.all([
            this.cluster.moderation.bans.userUnbanned(ban.guild, ban.user),
            this.cluster.moderation.eventLog.userUnbanned(ban.guild, ban.user),
            this.cluster.timeouts.deleteType(ban.guild.id, 'unban', { user: ban.user.id })
        ]);
    }
}
