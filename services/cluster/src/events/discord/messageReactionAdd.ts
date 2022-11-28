import { Cluster } from '@blargbot/cluster';
import { Emote } from '@blargbot/core/Emote';
import { DiscordEventService } from '@blargbot/core/serviceTypes';
import Eris from 'eris';

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
            await this.cluster.awaiter.reactions.tryConsume({ message: _message, user: _user, reaction: Emote.create(emoji) });
        });
    }

    protected async resolveMessage(message: Eris.PossiblyUncachedMessage): Promise<Eris.KnownMessage | undefined> {
        return await this.cluster.util.getMessage(message.channel.id, message.id);
    }

    protected async resolveUser(maybeUser: Eris.Member | Eris.Uncached): Promise<Eris.User | undefined> {
        return maybeUser instanceof Eris.Member ? maybeUser.user : await this.cluster.util.getUser(maybeUser.id);
    }
}
