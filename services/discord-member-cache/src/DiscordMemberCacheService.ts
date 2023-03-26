import type Discord from '@blargbot/discord-types';
import type { IKKVCache } from '@blargbot/redis-cache';

import type { SlimDiscordMember } from './SlimDiscordMember.js';
import { toSlimDiscordMember } from './SlimDiscordMember.js';

export class DiscordMemberCacheService {
    readonly #cache: IKKVCache<bigint, bigint, SlimDiscordMember>;

    public constructor(cache: IKKVCache<bigint, bigint, SlimDiscordMember>) {
        this.#cache = cache;
    }

    public async getAllMembers(guildId: bigint): Promise<SlimDiscordMember[]> {
        return [...(await this.#cache.getAll(guildId)).values()];
    }

    public async getMember(guildId: bigint, userId: bigint): Promise<SlimDiscordMember | undefined> {
        return await this.#cache.get(guildId, userId);
    }

    public async deleteAllMembers(guildId?: bigint): Promise<void> {
        guildId === undefined
            ? await this.#cache.clear()
            : await this.#cache.deleteAll(guildId);
    }

    public async getMemberCount(guildId: bigint): Promise<number> {
        return await this.#cache.size(guildId);
    }

    async #upsertGuild(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#cache.setAll(BigInt(guild.id), guild.members.filter(hasUser).map(m => [BigInt(m.user.id), toSlimDiscordMember(m)]));
    }

    public async handleGuildCreate(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#upsertGuild(guild);
    }

    public async handleGuildDelete(guild: Discord.GatewayGuildDeleteDispatchData): Promise<void> {
        await this.#cache.deleteAll(BigInt(guild.id));
    }

    public async handleGuildMemberAdd(member: Discord.GatewayGuildMemberAddDispatchData): Promise<void> {
        if (!hasUser(member))
            return;
        await this.#cache.set(BigInt(member.guild_id), BigInt(member.user.id), toSlimDiscordMember(member));
    }

    public async handleGuildMemberRemove(member: Discord.GatewayGuildMemberRemoveDispatchData): Promise<void> {
        await this.#cache.delete(BigInt(member.guild_id), BigInt(member.user.id));
    }

    public async handleGuildMemberUpdate(member: Discord.GatewayGuildMemberUpdateDispatchData): Promise<void> {
        if (!hasUser(member))
            return;
        await this.#cache.set(BigInt(member.guild_id), BigInt(member.user.id), toSlimDiscordMember(member));
    }

    public async handleGuildMembersChunk(chunk: Discord.GatewayGuildMembersChunkDispatchData): Promise<void> {
        await this.#cache.setAll(BigInt(chunk.guild_id), chunk.members.filter(hasUser).map(m => [BigInt(m.user.id), toSlimDiscordMember(m)]));
    }
}

function hasUser<T extends { user?: unknown; }>(member: T): member is T & { user: Exclude<T['user'], undefined>; } {
    return member.user !== undefined;
}
