import type Discord from '@blargbot/discord-types';

import type { DiscordInteractionStreamMessageBroker } from './DiscordInteractionStreamMessageBroker.js';

export class DiscordInteractionStreamService {
    readonly #messages: DiscordInteractionStreamMessageBroker;

    public constructor(messages: DiscordInteractionStreamMessageBroker) {
        this.#messages = messages;
    }

    public async handleInteractionCreate(message: Discord.GatewayInteractionCreateDispatchData): Promise<void> {
        await this.#messages.pushInteraction(message);
    }
}
