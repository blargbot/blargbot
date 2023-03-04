import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import Discord from '@blargbot/discord-types';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';

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

    public async pushInteraction(interaction: Discord.GatewayInteractionCreateDispatchData): Promise<void> {
        const route = `${interaction.type}.${this.#getInteractionId(interaction) ?? '-'}.${interaction.channel_id ?? '-'}.${interaction.user?.id ?? '-'}`;
        await this.publish(DiscordInteractionStreamMessageBroker.#interactionStream, route, this.jsonToBlob(interaction));
    }

    #getInteractionId(interaction: Discord.GatewayInteractionCreateDispatchData): string | undefined {
        switch (interaction.type) {
            case Discord.InteractionType.ApplicationCommand: return interaction.id;
            case Discord.InteractionType.ApplicationCommandAutocomplete: return interaction.id;
            case Discord.InteractionType.MessageComponent: return interaction.data.custom_id;
            case Discord.InteractionType.ModalSubmit: return interaction.data.custom_id;
            case Discord.InteractionType.Ping: return interaction.id;
            default: return interaction;
        }
    }
}
