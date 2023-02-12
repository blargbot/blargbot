import type { MessageHandle } from '@blargbot/message-broker';
import type { IKVCache } from '@blargbot/redis-cache';
import type * as discordeno from 'discordeno';

import type { DiscordGuildCacheMessageBroker } from './DiscordGuildCacheMessageBroker.js';
import type { SlimDiscordGuild } from './SlimDiscordGuild.js';
import { toSlimDiscordGuild } from './SlimDiscordGuild.js';

export class DiscordGuildCacheService {
    readonly #messages: DiscordGuildCacheMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #cache: IKVCache<bigint, SlimDiscordGuild>;

    public constructor(messages: DiscordGuildCacheMessageBroker, cache: IKVCache<bigint, SlimDiscordGuild>) {
        this.#messages = messages;
        this.#cache = cache;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleGuildCreate(this.#handleGuildCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildUpdate(this.#handleGuildUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildDelete(this.#handleGuildDelete.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    public async getGuild(guildId: bigint): Promise<SlimDiscordGuild | undefined> {
        return await this.#cache.get(guildId);
    }

    public async deleteAllGuilds(): Promise<void> {
        await this.#cache.clear();
    }

    public async getGuildCount(): Promise<number> {
        return await this.#cache.size();
    }

    async #upsertGuild(guild: discordeno.DiscordGuild): Promise<void> {
        await this.#cache.upsert(BigInt(guild.id), toSlimDiscordGuild(guild), (update, current) => ({
            ...current,
            ...update
        }));
    }

    async #handleGuildCreate(guild: discordeno.DiscordGuild): Promise<void> {
        await this.#upsertGuild(guild);
    }

    async #handleGuildUpdate(guild: discordeno.DiscordGuild): Promise<void> {
        await this.#upsertGuild(guild);
    }

    async #handleGuildDelete(guild: discordeno.DiscordUnavailableGuild): Promise<void> {
        await this.#cache.delete(BigInt(guild.id));
    }
}
