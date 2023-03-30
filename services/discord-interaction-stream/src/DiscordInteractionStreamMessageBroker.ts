import Discord from '@blargbot/discord-types';
import type { MessageHub } from '@blargbot/message-hub';
import { jsonToBlob } from '@blargbot/message-hub';

export class DiscordInteractionStreamMessageBroker {
    static readonly #interactionStream = 'discord-interaction-stream' as const;

    readonly #messages: MessageHub;

    public constructor(messages: MessageHub) {
        this.#messages = messages;

        this.#messages.onConnected(c => c.assertExchange(DiscordInteractionStreamMessageBroker.#interactionStream, 'topic', { durable: true }));
    }

    public async pushInteraction(interaction: Discord.GatewayInteractionCreateDispatchData): Promise<void> {
        const route = `${interaction.type}.${this.#getInteractionId(interaction) ?? '-'}.${interaction.channel_id ?? '-'}.${interaction.user?.id ?? '-'}`;
        await this.#messages.publish(DiscordInteractionStreamMessageBroker.#interactionStream, route, await jsonToBlob(interaction));
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
