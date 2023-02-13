import type { MessageHandle } from '@blargbot/message-broker';
import type { IKVCache } from '@blargbot/redis-cache';
import type * as discordeno from 'discordeno';

import type { DiscordMessageCacheMessageBroker } from './DiscordMessageCacheMessageBroker.js';

export class DiscordMessageCacheService {
    readonly #messages: DiscordMessageCacheMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #cache: IKVCache<bigint, bigint>;

    public constructor(messages: DiscordMessageCacheMessageBroker, cache: IKVCache<bigint, bigint>) {
        this.#messages = messages;
        this.#cache = cache;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleGuildCreate(this.#handleGuildCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleChannelCreate(this.#handleChannelCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleMessageCreate(this.#handleMessageCreate.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    public async getLastMessageId(channelId: bigint): Promise<bigint | undefined> {
        return await this.#cache.get(channelId);
    }

    async #setLastMessageTime(channelId: string, messageId: string | null = null): Promise<void> {
        if (messageId === null)
            await this.#cache.delete(BigInt(channelId));
        else
            await this.#cache.set(BigInt(channelId), BigInt(messageId));
    }

    async #handleGuildCreate(message: discordeno.DiscordGuild): Promise<void> {
        if (message.channels === undefined)
            return;

        await Promise.all(message.channels.map(c => this.#setLastMessageTime(c.id, c.last_message_id)));
    }

    async #handleChannelCreate(message: discordeno.DiscordChannel): Promise<void> {
        await this.#setLastMessageTime(message.id, message.last_message_id);
    }

    async #handleMessageCreate(message: discordeno.DiscordMessage): Promise<void> {
        await this.#setLastMessageTime(message.channel_id, message.id);
    }
}
