import type { PartialDiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type { SlimDiscordGuild } from '@blargbot/discord-guild-cache-client';
import { toSlimDiscordGuild } from '@blargbot/discord-guild-cache-client';
import type Discord from '@blargbot/discord-types';
import type { MessageHandle } from '@blargbot/message-hub';
import type { IKVCache } from '@blargbot/redis-cache';

type DiscordGatewayMessageBroker = PartialDiscordGatewayMessageBroker<
    | 'GUILD_CREATE'
    | 'GUILD_UPDATE'
    | 'GUILD_DELETE'
>;

export class DiscordGuildCacheService {
    readonly #gateway: DiscordGatewayMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #cache: IKVCache<bigint, SlimDiscordGuild>;

    public constructor(gateway: DiscordGatewayMessageBroker, cache: IKVCache<bigint, SlimDiscordGuild>) {
        this.#gateway = gateway;
        this.#cache = cache;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#gateway.handleGuildCreate(this.#handleGuildCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleGuildUpdate(this.#handleGuildUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleGuildDelete(this.#handleGuildDelete.bind(this)).then(h => this.#handles.add(h))
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

    async #upsertGuild(guild: Discord.APIGuild): Promise<void> {
        await this.#cache.set(BigInt(guild.id), toSlimDiscordGuild(guild));
    }

    async #handleGuildCreate(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#upsertGuild(guild);
    }

    async #handleGuildUpdate(guild: Discord.GatewayGuildUpdateDispatchData): Promise<void> {
        await this.#upsertGuild(guild);
    }

    async #handleGuildDelete(guild: Discord.GatewayGuildDeleteDispatchData): Promise<void> {
        await this.#cache.delete(BigInt(guild.id));
    }
}
