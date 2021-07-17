import { Cluster } from '@cluster';
import { guard } from '@cluster/utils';
import { DiscordEventService } from '@core/serviceTypes';
import { Emoji, Member, Message, PossiblyUncachedMessage, TextableChannel, User } from 'eris';

export class DiscordMessageReactionAddHandler extends DiscordEventService<'messageReactionAdd'> {
    public constructor(public readonly cluster: Cluster) {
        super(cluster.discord, 'messageReactionAdd', cluster.logger);
    }

    protected async execute(maybeMessage: PossiblyUncachedMessage, emoji: Emoji, maybeUser: Member | { id: string; }): Promise<void> {
        const message = await this.resolveMessage(maybeMessage);
        if (message === undefined)
            return;

        const user = this.resolveUser(maybeUser);
        if (user === undefined)
            return;

        this.cluster.reactionAwaiter.emit(message, emoji, user);
        await this.cluster.autoresponses.handleWhitelistApproval(message, emoji, user);
    }

    protected async resolveMessage(message: PossiblyUncachedMessage): Promise<Message | undefined> {
        if ('content' in message)
            return message;

        const channel = this.resolveChannel(message.channel);
        if (channel === undefined)
            return;
        try {
            return await channel.getMessage(message.id);
        } catch (err: unknown) {
            return undefined;
        }

    }

    protected resolveChannel(maybeChannel: PossiblyUncachedMessage['channel']): TextableChannel | undefined {
        const channel = 'type' in maybeChannel ? maybeChannel : this.cluster.discord.getChannel(maybeChannel.id);
        return channel !== undefined && guard.isTextableChannel(channel) ? channel : undefined;
    }

    protected resolveUser(maybeUser: Member | { id: string; }): User | undefined {
        return 'user' in maybeUser ? maybeUser.user : this.cluster.discord.users.get(maybeUser.id);
    }
}
