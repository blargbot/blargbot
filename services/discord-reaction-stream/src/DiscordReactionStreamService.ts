import type Discord from '@blargbot/discord-types';

import type { DiscordReactionStreamMessageBroker } from './DiscordReactionStreamMessageBroker.js';

export class DiscordReactionStreamService {
    readonly #messages: DiscordReactionStreamMessageBroker;

    public constructor(messages: DiscordReactionStreamMessageBroker) {
        this.#messages = messages;
    }

    public async handleMessageReactionAdd(reaction: Discord.GatewayMessageReactionAddDispatchData): Promise<void> {
        await this.#messages.pushReaction(reaction);
    }
}
