import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import type * as discordeno from 'discordeno';

export class DiscordInteractionStreamMessageBroker extends discordMessageBrokerMixin({
    type: MessageBroker,
    eventExchange: 'discord-gateway-events',
    serviceName: 'discord-interaction-stream',
    events: [
        'INTERACTION_CREATE'
    ]
}) {
    static readonly #interactionStream = 'discord-interaction-stream' as const;
    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await Promise.all([
            super.onceConnected(channel),
            channel.assertExchange(DiscordInteractionStreamMessageBroker.#interactionStream, 'topic', { durable: true })
        ]);
    }

    public async pushInteraction(interaction: discordeno.DiscordInteraction): Promise<void> {
        const data: Partial<NonNullable<discordeno.DiscordInteraction['data']>> = interaction.data ?? {};
        const route = `${interaction.type}.${data.custom_id ?? data.id ?? '-'}.${interaction.channel_id ?? '-'}.${interaction.user?.id ?? '-'}`;
        await this.sendMessage(DiscordInteractionStreamMessageBroker.#interactionStream, route, this.jsonToBlob(interaction));
    }
}
