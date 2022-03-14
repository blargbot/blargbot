import { Cluster } from '@blargbot/cluster';
import { guard } from '@blargbot/cluster/utils';
import { DiscordEventService } from '@blargbot/core/serviceTypes';
import { PartialUser, User } from 'eris';

export class DiscordUserUpdateHandler extends DiscordEventService<'userUpdate'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'userUpdate', cluster.logger, (user, oldUser) => this.execute(user, oldUser));
    }

    public async execute(user: User | undefined | null, oldUser: PartialUser | null | undefined): Promise<void> {
        if (!guard.hasValue(user) || user.id === this.cluster.discord.user.id)
            return;

        const promises: Array<Promise<unknown>> = [this.cluster.database.users.upsert(user)];
        if (!guard.hasValue(oldUser)) {
            await Promise.all(promises);
            return;
        }

        if (oldUser.username !== user.username || oldUser.discriminator !== user.discriminator)
            promises.push(this.cluster.moderation.eventLog.userTagUpdated(user, new User({ ...oldUser }, this.cluster.discord)));

        if (oldUser.avatar !== user.avatar)
            promises.push(this.cluster.moderation.eventLog.userAvatarUpdated(user, new User({ ...oldUser }, this.cluster.discord)));

        await Promise.all(promises);
    }
}
