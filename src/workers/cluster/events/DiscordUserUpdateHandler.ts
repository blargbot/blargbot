import { Cluster } from '@cluster';
import { guard } from '@cluster/utils';
import { DiscordEventService } from '@core/serviceTypes';
import { PartialUser, User } from 'discord.js';

export class DiscordUserUpdateHandler extends DiscordEventService<'userUpdate'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'userUpdate', cluster.logger);
    }

    public async execute(oldUser: PartialUser | User, user: User): Promise<void> {
        if (user.id === this.cluster.discord.user.id)
            return;

        const promises: Array<Promise<unknown>> = [this.cluster.database.users.upsert(user)];
        if (!guard.hasValue(oldUser)) {
            await Promise.all(promises);
            return;
        }

        if (oldUser.username !== user.username || oldUser.discriminator !== user.discriminator)
            promises.push(this.cluster.moderation.eventLog.userTagUpdated(user, oldUser));

        if (oldUser.avatar !== user.avatar)
            promises.push(this.cluster.moderation.eventLog.userAvatarUpdated(user, oldUser));

        await Promise.all(promises);
    }

}
