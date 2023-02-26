import type { MessageHandle } from '@blargbot/message-broker';
import type Discord from '@blargbot/discord-types';

import type { DiscordInteractionStreamMessageBroker } from './DiscordInteractionStreamMessageBroker.js';

export class DiscordInteractionStreamService {
    readonly #messages: DiscordInteractionStreamMessageBroker;
    readonly #handles: Set<MessageHandle>;

    public constructor(messages: DiscordInteractionStreamMessageBroker) {
        this.#messages = messages;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleInteractionCreate(this.#handleInteractionCreate.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    async #handleInteractionCreate(message: Discord.GatewayInteractionCreateDispatchData): Promise<void> {
        await this.#messages.pushInteraction(message);
    }
}
