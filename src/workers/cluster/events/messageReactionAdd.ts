import { PossiblyUncachedMessage, Emoji, Member, Message, User, TextableChannel, AnyChannel } from 'eris';
import { Cluster } from '../Cluster';
import { DiscordEventService } from '../core';

export class MessageReactionAddHandler extends DiscordEventService<'messageReactionAdd'> {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageReactionAdd', cluster.logger);
    }

    protected async execute(maybeMessage: PossiblyUncachedMessage, emoji: Emoji, maybeUser: Member | { id: string; }): Promise<void> {
        const message = await this.resolveMessage(maybeMessage);
        if (!message) return;
        const user = await this.resolveUser(maybeUser);
        if (!user) return;

        this.cluster.util.reactionAwaiter.emit(message, emoji, user);
    }

    protected async resolveMessage(message: PossiblyUncachedMessage): Promise<Message | undefined> {
        if ('content' in message)
            return message;

        const channel = this.resolveChannel(message.channel);
        if (!channel) return;
        try {
            return await channel.getMessage(message.id);
        } catch (err: unknown) {
            return undefined;
        }

    }

    protected resolveChannel(maybeChannel: PossiblyUncachedMessage['channel']): TextableChannel | undefined {
        let channel: AnyChannel;
        if ('type' in maybeChannel) {
            channel = maybeChannel;
        } else {
            try {
                channel = this.cluster.discord.getChannel(maybeChannel.id);
            } catch { return undefined; }
        }

        return 'messages' in channel ? channel : undefined;
    }

    protected async resolveUser(maybeUser: Member | { id: string; }): Promise<User | undefined> {
        if ('user' in maybeUser)
            return maybeUser.user;

        try {
            return await this.cluster.discord.getRESTUser(maybeUser.id);
        } catch (error: unknown) {
            return undefined;
        }
    }
}