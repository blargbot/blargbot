import { Cluster } from '@blargbot/cluster';
import { guard } from '@blargbot/cluster/utils';
import { Lazy } from '@blargbot/core/Lazy';
import { DiscordEventService } from '@blargbot/core/serviceTypes';
import Eris from 'eris';

export class DiscordUserUpdateHandler extends DiscordEventService<'userUpdate'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'userUpdate', cluster.logger, (user, oldUser) => this.execute(user, oldUser));
    }

    public async execute(user: Eris.User | undefined | null, oldUser: Eris.PartialUser | null | undefined): Promise<void> {
        if (!guard.hasValue(user) || user.id === this.cluster.discord.user.id)
            return;

        const promises: Array<Promise<unknown>> = [this.#updateDb(user)];
        if (!guard.hasValue(oldUser)) {
            await Promise.all(promises);
            return;
        }

        const fullOldUser = new Lazy(() => new Eris.User({ ...oldUser }, this.cluster.discord));
        if (oldUser.username !== user.username || oldUser.discriminator !== user.discriminator)
            promises.push(this.#modlogTagUpdate(user, fullOldUser.value));

        if (oldUser.avatar !== user.avatar)
            promises.push(this.#modlogAvatarUpdate(user, fullOldUser.value));

        await Promise.all(promises);
    }

    async #updateDb(user: Eris.User): Promise<void> {
        try {
            await this.cluster.database.users.upsert(user);
        } catch (ex: unknown) {
            this.cluster.logger.error('Error while updating the db for a user', ex);
        }
    }

    async #modlogTagUpdate(user: Eris.User, oldUser: Eris.User): Promise<void> {
        try {
            await this.cluster.moderation.eventLog.userTagUpdated(user, oldUser);
        } catch (ex: unknown) {
            this.cluster.logger.error('Error while evaluating modlog for a user tag update', ex);
        }
    }

    async #modlogAvatarUpdate(user: Eris.User, oldUser: Eris.User): Promise<void> {
        try {
            await this.cluster.moderation.eventLog.userAvatarUpdated(user, oldUser);
        } catch (ex: unknown) {
            this.cluster.logger.error('Error while evaluating modlog for a user avatar update', ex);
        }
    }
}
