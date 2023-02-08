import type { MessageHandle } from '@blargbot/message-broker';
import type * as discordeno from 'discordeno';

import type { DiscordMessageStreamMessageBroker } from './DiscordMessageStreamMessageBroker.js';

export class DiscordMessageStreamService {
    readonly #messages: DiscordMessageStreamMessageBroker;
    readonly #handles: Set<MessageHandle>;

    public constructor(messages: DiscordMessageStreamMessageBroker) {
        this.#messages = messages;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleMessageCreate(this.#handleMessageCreate.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    async #handleMessageCreate(message: discordeno.DiscordMessage): Promise<void> {
        await this.#messages.pushMessage(message);
    }
}
