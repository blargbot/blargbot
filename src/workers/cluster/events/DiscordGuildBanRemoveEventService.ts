import { Guild, User } from 'eris';
import { Cluster } from '../Cluster';
import { DiscordEventService } from '../core';

export class DiscordGuildBanRemoveEventService extends DiscordEventService<'guildBanRemove'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildBanRemove', cluster.logger);
    }

    protected async execute(guild: Guild, user: User): Promise<void> {
        await Promise.all([
            this.cluster.moderation.bans.userUnbanned(guild, user),
            this.cluster.moderation.eventLog.userUnbanned(guild, user),
            this.cluster.timeouts.deleteType(guild.id, 'unban', { user: user.id })
        ]);
    }
}
