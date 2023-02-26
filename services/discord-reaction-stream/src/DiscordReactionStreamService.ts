import type Discord from '@blargbot/discord-types';
import type { MessageHandle } from '@blargbot/message-broker';

import type { DiscordReactionStreamMessageBroker } from './DiscordReactionStreamMessageBroker.js';

export class DiscordReactionStreamService {
    readonly #messages: DiscordReactionStreamMessageBroker;
    readonly #handles: Set<MessageHandle>;

    public constructor(messages: DiscordReactionStreamMessageBroker) {
        this.#messages = messages;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleMessageReactionAdd(this.#handleMessageReactionAdd.bind(this)).then(h => this.#handles.add(h))
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
