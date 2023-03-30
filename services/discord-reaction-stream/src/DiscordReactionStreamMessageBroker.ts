import type Discord from '@blargbot/discord-types';
import type { MessageHub } from '@blargbot/message-hub';
import { jsonToBlob } from '@blargbot/message-hub';

export class DiscordReactionStreamMessageBroker {
    static readonly #reactionStream = 'discord-reaction-stream' as const;

    readonly #messages: MessageHub;

    public constructor(messages: MessageHub) {
        this.#messages = messages;

        this.#messages.onConnected(c => c.assertExchange(DiscordReactionStreamMessageBroker.#reactionStream, 'topic', { durable: true }));
    }

    public async pushReaction(message: Discord.GatewayMessageReactionAddDispatchData): Promise<void> {
        const emoteId = message.emoji.id ?? message.emoji.name ?? '';
        await this.#messages.publish(DiscordReactionStreamMessageBroker.#reactionStream, `${message.message_id}.${message.user_id}.${emoteId}`, await jsonToBlob(message));
    }
}
