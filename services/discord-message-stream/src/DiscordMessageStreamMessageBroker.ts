import type { ExtendedMessage } from '@blargbot/discord-message-stream-contract';
import type { MessageHub } from '@blargbot/message-hub';
import { jsonToBlob } from '@blargbot/message-hub';

export class DiscordMessageStreamMessageBroker {
    static readonly #messageStream = 'discord-message-stream' as const;

    readonly #messages: MessageHub;

    public constructor(messages: MessageHub) {
        this.#messages = messages;

        this.#messages.onConnected(c => c.assertExchange(DiscordMessageStreamMessageBroker.#messageStream, 'topic', { durable: true }));
    }

    public async pushMessage(message: ExtendedMessage): Promise<void> {
        await this.#messages.publish(DiscordMessageStreamMessageBroker.#messageStream, `${message.guild_id ?? 'dm'}.${message.channel_id}.${message.author.id}`, jsonToBlob(message));
    }
}
