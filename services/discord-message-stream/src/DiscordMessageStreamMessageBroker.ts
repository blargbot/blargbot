import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import type * as discordeno from 'discordeno';

export class DiscordMessageStreamMessageBroker extends discordMessageBrokerMixin(MessageBroker, 'MESSAGE_CREATE') {
    static readonly #messageStream = 'discord-message-stream' as const;

    public constructor(options: DiscordMessageStreamMessageBrokerOptions) {
        super('discord-gateway-events', DiscordMessageStreamMessageBroker.#messageStream, options);
    }

    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await Promise.all([
            super.onceConnected(channel),
            channel.assertExchange(DiscordMessageStreamMessageBroker.#messageStream, 'topic', { durable: true })
        ]);
    }

    public async pushMessage(message: discordeno.DiscordMessage): Promise<void> {
        await this.sendMessage(DiscordMessageStreamMessageBroker.#messageStream, `${message.channel_id}.${message.author.id}`, this.jsonToBlob(message));
    }
}

export interface DiscordMessageStreamMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
