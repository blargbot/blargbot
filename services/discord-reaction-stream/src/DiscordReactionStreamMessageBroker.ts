import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import type * as discordeno from 'discordeno';

export class DiscordReactionStreamMessageBroker extends discordMessageBrokerMixin(MessageBroker, 'MESSAGE_REACTION_ADD') {
    static readonly #reactionStream = 'discord-reaction-stream' as const;

    public constructor(options: DiscordReactionStreamMessageBrokerOptions) {
        super('discord-gateway-events', DiscordReactionStreamMessageBroker.#reactionStream, options);
    }

    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await Promise.all([
            super.onceConnected(channel),
            channel.assertExchange(DiscordReactionStreamMessageBroker.#reactionStream, 'topic', { durable: true })
        ]);
    }

    public async pushReaction(message: discordeno.DiscordMessageReactionAdd): Promise<void> {
        const emoteId = message.emoji.id ?? message.emoji.name ?? '';
        await this.sendMessage(DiscordReactionStreamMessageBroker.#reactionStream, `${message.message_id}.${message.user_id}.${emoteId}`, this.jsonToBlob(message));
    }
}

export interface DiscordReactionStreamMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
