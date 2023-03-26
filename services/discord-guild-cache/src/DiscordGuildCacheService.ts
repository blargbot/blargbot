import type { SlimDiscordGuild } from '@blargbot/discord-guild-cache-client';
import { toSlimDiscordGuild } from '@blargbot/discord-guild-cache-client';
import type Discord from '@blargbot/discord-types';
import type { IKVCache } from '@blargbot/redis-cache';

export class DiscordGuildCacheService {
    readonly #cache: IKVCache<bigint, SlimDiscordGuild>;

    public constructor(cache: IKVCache<bigint, SlimDiscordGuild>) {
        this.#cache = cache;
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

    public async handleGuildCreate(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#upsertGuild(guild);
    }

    public async handleGuildUpdate(guild: Discord.GatewayGuildUpdateDispatchData): Promise<void> {
        await this.#upsertGuild(guild);
    }

    public async handleGuildDelete(guild: Discord.GatewayGuildDeleteDispatchData): Promise<void> {
        await this.#cache.delete(BigInt(guild.id));
    }
}
