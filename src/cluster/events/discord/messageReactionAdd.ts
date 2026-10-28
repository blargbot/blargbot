import type { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core';
import Emote from '@blargbot/discord-emote';
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
            this.cluster.awaiter.reactions.push({
                messageId: _message.id,
                authorId: _message.author.id,
                channelId: _message.channel.id,
                guildId: 'guild' in _message.channel
                    ? _message.channel.guild.id
                    : undefined,
                reactorId: _user.id,
                reaction: new Emote(emoji.name, emoji.id === null ? undefined : BigInt(emoji.id), emoji.animated)
            });
        });
    }

    protected async resolveMessage(message: eris.PossiblyUncachedMessage): Promise<eris.KnownMessage | undefined> {
        return await this.cluster.util.getMessage(message.channel.id, message.id);
    }

    protected async resolveUser(maybeUser: eris.Member | eris.Uncached): Promise<eris.User | undefined> {
        return maybeUser instanceof eris.Member ? maybeUser.user : await this.cluster.util.getUser(maybeUser.id);
    }
}
