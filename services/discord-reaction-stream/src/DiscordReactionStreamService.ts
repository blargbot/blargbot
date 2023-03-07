import type { PartialDiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import type { MessageHandle } from '@blargbot/message-hub';

import type { DiscordReactionStreamMessageBroker } from './DiscordReactionStreamMessageBroker.js';

type DiscordGatewayMessageBroker = PartialDiscordGatewayMessageBroker<
    | 'MESSAGE_REACTION_ADD'
>;

export class DiscordReactionStreamService {
    readonly #messages: DiscordReactionStreamMessageBroker;
    readonly #gateway: DiscordGatewayMessageBroker;
    readonly #handles: Set<MessageHandle>;

    public constructor(messages: DiscordReactionStreamMessageBroker, gateway: DiscordGatewayMessageBroker) {
        this.#messages = messages;
        this.#gateway = gateway;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#gateway.handleMessageReactionAdd(this.#handleMessageReactionAdd.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    async #handleMessageReactionAdd(reaction: Discord.GatewayMessageReactionAddDispatchData): Promise<void> {
        await this.#messages.pushReaction(reaction);
    }
}
