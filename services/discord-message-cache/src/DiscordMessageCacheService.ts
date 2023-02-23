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

    async #setLastMessageTime(values: Iterable<[channelId: string, messageId: string | null]>): Promise<void> {
        const promises = [];
        const toSet = [];
        for (const [channelId, messageId] of values) {
            if (messageId === null)
                promises.push(this.#cache.delete(BigInt(channelId)));
            else
                toSet.push([BigInt(channelId), BigInt(messageId)] as const);
        }
        promises.push(this.#cache.setAll(toSet));
        await Promise.all(promises);
    }

    async #handleGuildCreate(message: discordeno.DiscordGuild): Promise<void> {
        if (message.channels === undefined)
            return;

        await this.#setLastMessageTime(message.channels.map(c => [c.id, c.last_message_id ?? null]));
    }

    async #handleChannelCreate(message: discordeno.DiscordChannel): Promise<void> {
        await this.#setLastMessageTime([[message.id, message.last_message_id ?? null]]);
    }

    async #handleMessageCreate(message: discordeno.DiscordMessage): Promise<void> {
        await this.#setLastMessageTime([[message.channel_id, message.id]]);
    }
}
