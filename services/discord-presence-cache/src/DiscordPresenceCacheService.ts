import type Discord from '@blargbot/discord-types';
import type { IKKVCache } from '@blargbot/redis-cache';

import type { DiscordUserPresence } from './DiscordUserPresence.js';
import { toDiscordUserPresence } from './DiscordUserPresence.js';

export class DiscordPresenceCacheService {
    readonly #cache: IKKVCache<bigint, bigint, DiscordUserPresence>;

    public constructor(cache: IKKVCache<bigint, bigint, DiscordUserPresence>) {
        this.#cache = cache;
    }

    public async getPresence(guildId: bigint, userId: bigint): Promise<DiscordUserPresence | undefined> {
        return await this.#cache.get(guildId, userId);
    }

    public async clear(guildId?: bigint): Promise<void> {
        guildId === undefined
            ? await this.#cache.clear()
            : await this.#cache.deleteAll(guildId);
    }

    public async getPresenceCount(guildId: bigint): Promise<number> {
        return await this.#cache.size(guildId);
    }

    public async handlePresenceUpdate(message: Discord.GatewayPresenceUpdateDispatchData): Promise<void> {
        await this.#cache.set(BigInt(message.guild_id), BigInt(message.user.id), toDiscordUserPresence(message));
    }

    public async handleGuildCreate(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#cache.setAll(BigInt(guild.id), guild.presences.filter(hasUser).map(p => [BigInt(p.user.id), toDiscordUserPresence(p)]));
    }

    public async handleGuildDelete(guild: Discord.GatewayGuildDeleteDispatchData): Promise<void> {
        await this.#cache.deleteAll(BigInt(guild.id));
    }

    public async handleGuildMemberRemove(member: Discord.GatewayGuildMemberRemoveDispatchData): Promise<void> {
        await this.#cache.delete(BigInt(member.guild_id), BigInt(member.user.id));
    }

    public async handleGuildMembersChunk(chunk: Discord.GatewayGuildMembersChunkDispatchData): Promise<void> {
        if (chunk.presences === undefined)
            return;

        await this.#cache.setAll(BigInt(chunk.guild_id), chunk.presences.map(m => [BigInt(m.user.id), toDiscordUserPresence(m)]));
    }

}

function hasUser<T extends { user?: unknown; }>(member: T): member is T & { user: Exclude<T['user'], undefined>; } {
    return member.user !== undefined;
}
