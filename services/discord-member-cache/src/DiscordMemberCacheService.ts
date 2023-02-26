import type { MessageHandle } from '@blargbot/message-broker';
import type { IKKVCache } from '@blargbot/redis-cache';
import type Discord from '@blargbot/discord-types';

import type { DiscordMemberCacheMessageBroker } from './DiscordMemberCacheMessageBroker.js';
import type { SlimDiscordMember } from './SlimDiscordMember.js';
import { toSlimDiscordMember } from './SlimDiscordMember.js';

export class DiscordMemberCacheService {
    readonly #messages: DiscordMemberCacheMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #cache: IKKVCache<bigint, bigint, SlimDiscordMember>;

    public constructor(messages: DiscordMemberCacheMessageBroker, cache: IKKVCache<bigint, bigint, SlimDiscordMember>) {
        this.#messages = messages;
        this.#cache = cache;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleGuildCreate(this.#handleGuildCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildDelete(this.#handleGuildDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildMemberAdd(this.#handleGuildMemberAdd.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildMemberRemove(this.#handleGuildMemberRemove.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildMemberUpdate(this.#handleGuildMemberUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildMembersChunk(this.#handleGuildMembersChunk.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
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

    async #handleGuildCreate(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#upsertGuild(guild);
    }

    async #handleGuildDelete(guild: Discord.GatewayGuildDeleteDispatchData): Promise<void> {
        await this.#cache.deleteAll(BigInt(guild.id));
    }

    async #handleGuildMemberAdd(member: Discord.GatewayGuildMemberAddDispatchData): Promise<void> {
        if (!hasUser(member))
            return;
        await this.#cache.set(BigInt(member.guild_id), BigInt(member.user.id), toSlimDiscordMember(member));
    }

    async #handleGuildMemberRemove(member: Discord.GatewayGuildMemberRemoveDispatchData): Promise<void> {
        await this.#cache.delete(BigInt(member.guild_id), BigInt(member.user.id));
    }

    async #handleGuildMemberUpdate(member: Discord.GatewayGuildMemberUpdateDispatchData): Promise<void> {
        if (!hasUser(member))
            return;
        await this.#cache.set(BigInt(member.guild_id), BigInt(member.user.id), toSlimDiscordMember(member));
    }

    async #handleGuildMembersChunk(chunk: Discord.GatewayGuildMembersChunkDispatchData): Promise<void> {
        await this.#cache.setAll(BigInt(chunk.guild_id), chunk.members.filter(hasUser).map(m => [BigInt(m.user.id), toSlimDiscordMember(m)]));
    }
}

function hasUser<T extends { user?: unknown; }>(member: T): member is T & { user: Exclude<T['user'], undefined>; } {
    return member.user !== undefined;
}
