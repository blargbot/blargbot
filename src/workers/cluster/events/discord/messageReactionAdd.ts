import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { KnownMessage, Member, PossiblyUncachedMessage, Uncached, User } from 'eris';

export class DiscordMessageReactionAddHandler extends DiscordEventService<'messageReactionAdd'> {
    public constructor(public readonly cluster: Cluster) {
        super(cluster.discord, 'messageReactionAdd', cluster.logger, async (message, emoji, user) => {
            const _message = await this.resolveMessage(message);
            if (_message === undefined)
                return;

            const _user = await this.resolveUser(user);
            if (_user === undefined)
                return;

            await this.cluster.autoresponses.handleWhitelistApproval(_message, emoji, _user);
            await this.cluster.awaiter.reactions.tryConsume({ message: _message, user: _user, reaction: emoji });
        });
    }

    protected async resolveMessage(message: PossiblyUncachedMessage): Promise<KnownMessage | undefined> {
        return await this.cluster.util.getMessage(message.channel.id, message.id);
    }

    protected async resolveUser(maybeUser: Member | Uncached): Promise<User | undefined> {
        return maybeUser instanceof Member ? maybeUser.user : await this.cluster.util.getUser(maybeUser.id);
    }
}
