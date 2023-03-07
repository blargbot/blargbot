import type { PartialDiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import type { MessageHandle } from '@blargbot/message-hub';

import type { DiscordInteractionStreamMessageBroker } from './DiscordInteractionStreamMessageBroker.js';

type DiscordGatewayMessageBroker = PartialDiscordGatewayMessageBroker<
    | 'INTERACTION_CREATE'
>;

export class DiscordInteractionStreamService {
    readonly #messages: DiscordInteractionStreamMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #gateway: DiscordGatewayMessageBroker;

    public constructor(messages: DiscordInteractionStreamMessageBroker, gateway: DiscordGatewayMessageBroker) {
        this.#messages = messages;
        this.#gateway = gateway;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#gateway.handleInteractionCreate(this.#handleInteractionCreate.bind(this)).then(h => this.#handles.add(h))
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
