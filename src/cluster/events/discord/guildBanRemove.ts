import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes';
import { Guild, User } from 'eris';

export class DiscordGuildBanRemoveEventService extends DiscordEventService<`guildBanRemove`> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, `guildBanRemove`, cluster.logger, (guild, user) => this.execute(guild, user));
    }

    public async execute(guild: Guild, user: User): Promise<void> {
        await Promise.all([
            this.cluster.moderation.bans.userUnbanned(guild, user),
            this.cluster.moderation.eventLog.userUnbanned(guild, user),
            this.cluster.timeouts.deleteType(guild.id, `unban`, { user: user.id })
        ]);
    }
}
