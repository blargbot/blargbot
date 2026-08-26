import type { Cluster } from '@blargbot/cluster';
import { Emote } from '@blargbot/core/Emote.js';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';
import * as eris from 'eris';

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

    protected async resolveMessage(message: eris.PossiblyUncachedMessage): Promise<eris.KnownMessage | undefined> {
        return await this.cluster.util.getMessage(message.channel.id, message.id);
    }

    protected async resolveUser(maybeUser: eris.Member | eris.Uncached): Promise<eris.User | undefined> {
        return maybeUser instanceof eris.Member ? maybeUser.user : await this.cluster.util.getUser(maybeUser.id);
    }
}
