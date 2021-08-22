import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { Message, MessageReaction, PartialMessage, PartialMessageReaction, PartialUser, User } from 'discord.js';

export class DiscordMessageReactionAddHandler extends DiscordEventService<'messageReactionAdd'> {
    public constructor(public readonly cluster: Cluster) {
        super(cluster.discord, 'messageReactionAdd', cluster.logger);
    }

    protected async execute(maybeReaction: MessageReaction | PartialMessageReaction, maybeUser: User | PartialUser): Promise<void> {
        const message = await this.resolveMessage(maybeReaction.message);
        if (message === undefined)
            return;

        const user = await this.resolveUser(maybeUser);
        if (user === undefined)
            return;

        await this.cluster.autoresponses.handleWhitelistApproval(message, maybeReaction.emoji, user);
        await this.cluster.await.reactions.checkTagReaction(message, user, maybeReaction);
    }

    protected async resolveMessage(message: Message | PartialMessage): Promise<Message | undefined> {
        if (!message.partial)
            return message;

        try {
            return await message.channel.messages.fetch(message.id);
        } catch (err: unknown) {
            return undefined;
        }

    }

    protected async resolveUser(maybeUser: User | PartialUser): Promise<User | undefined> {
        return !maybeUser.partial ? maybeUser : await this.cluster.util.getUser(maybeUser.id);
    }
}
