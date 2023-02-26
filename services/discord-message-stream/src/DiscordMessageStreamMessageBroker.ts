import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import type Discord from '@blargbot/discord-types';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';

export class DiscordMessageStreamMessageBroker extends discordMessageBrokerMixin({
    type: MessageBroker,
    eventExchange: 'discord-gateway-events',
    serviceName: 'discord-message-stream',
    events: [
        'MESSAGE_CREATE'
    ]
}) {
    static readonly #messageStream = 'discord-message-stream' as const;
    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await Promise.all([
            super.onceConnected(channel),
            channel.assertExchange(DiscordMessageStreamMessageBroker.#messageStream, 'topic', { durable: true })
        ]);
    }

    public async pushMessage(message: Discord.APIMessage): Promise<void> {
        await this.sendMessage(DiscordMessageStreamMessageBroker.#messageStream, `${message.channel_id}.${message.author.id}`, this.jsonToBlob(message));
    }
}
