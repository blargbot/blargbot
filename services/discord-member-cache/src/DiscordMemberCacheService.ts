import type { MessageHandle } from '@blargbot/message-broker';
import type { IKKVCache } from '@blargbot/redis-cache';
import type * as discordeno from 'discordeno';

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
            this.#messages.handleGuildUpdate(this.#handleGuildUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildDelete(this.#handleGuildDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleMemberAdd(this.#handleMemberAdd.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleMemberRemove(this.#handleMemberRemove.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleMemberUpdate(this.#handleMemberUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleMembersChunk(this.#handleMembersChunk.bind(this)).then(h => this.#handles.add(h))
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

    async #upsertGuild(guild: discordeno.DiscordGuild): Promise<void> {
        if (guild.members === undefined)
            return;
        await this.#cache.setAll(BigInt(guild.id), guild.members.filter(hasUser).map(m => [BigInt(m.user.id), toSlimDiscordMember(m)]));
    }

    async #handleGuildCreate(guild: discordeno.DiscordGuild): Promise<void> {
        await this.#upsertGuild(guild);
    }

    async #handleGuildUpdate(guild: discordeno.DiscordGuild): Promise<void> {
        await this.#upsertGuild(guild);
    }

    async #handleGuildDelete(guild: discordeno.DiscordUnavailableGuild): Promise<void> {
        await this.#cache.deleteAll(BigInt(guild.id));
    }

    async #handleMemberAdd(member: discordeno.DiscordGuildMemberAdd): Promise<void> {
        await this.#cache.set(BigInt(member.guild_id), BigInt(member.user.id), toSlimDiscordMember(member));
    }

    async #handleMemberRemove(member: discordeno.DiscordGuildMemberRemove): Promise<void> {
        await this.#cache.delete(BigInt(member.guild_id), BigInt(member.user.id));
    }

    async #handleMemberUpdate(member: discordeno.DiscordGuildMemberUpdate): Promise<void> {
        await this.#cache.upsert(BigInt(member.guild_id), BigInt(member.user.id), toSlimDiscordMember(member), (update, current) => ({
            ...current,
            ...update
        }));
    }

    async #handleMembersChunk(chunk: discordeno.DiscordGuildMembersChunk): Promise<void> {
        await this.#cache.setAll(BigInt(chunk.guild_id), chunk.members.map(m => [BigInt(m.user.id), toSlimDiscordMember(m)]));
    }
}

function hasUser<T extends discordeno.DiscordMember>(member: T): member is T & discordeno.DiscordMemberWithUser {
    return member.user !== undefined;
}
