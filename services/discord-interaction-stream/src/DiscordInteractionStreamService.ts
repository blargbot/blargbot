import type { DiscordInteractionStreamMessageBroker } from '@blargbot/discord-interaction-stream-client';
import type Discord from '@blargbot/discord-types';

export class DiscordInteractionStreamService {
    readonly #messages: DiscordInteractionStreamMessageBroker;

    public constructor(messages: DiscordInteractionStreamMessageBroker) {
        this.#messages = messages;
    }

    public async handleInteractionCreate(message: Discord.GatewayInteractionCreateDispatchData): Promise<void> {
        await this.#messages.pushInteraction(message);
    }
}
