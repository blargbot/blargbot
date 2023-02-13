import type { MessageHandle } from '@blargbot/message-broker';
import type { IKKVCache } from '@blargbot/redis-cache';
import type * as discordeno from 'discordeno';

import type { DiscordRoleCacheMessageBroker } from './DiscordRoleCacheMessageBroker.js';

export class DiscordRoleCacheService {
    readonly #messages: DiscordRoleCacheMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #cache: IKKVCache<bigint, bigint, discordeno.DiscordRole>;

    public constructor(messages: DiscordRoleCacheMessageBroker, cache: IKKVCache<bigint, bigint, discordeno.DiscordRole>) {
        this.#messages = messages;
        this.#cache = cache;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleGuildCreate(this.#handleGuildCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildUpdate(this.#handleGuildUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildDelete(this.#handleGuildDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildRoleCreate(this.#handleGuildRoleCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildRoleUpdate(this.#handleGuildRoleUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildRoleDelete(this.#handleGuildRoleDelete.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    public async getAllRoles(guildId: bigint): Promise<discordeno.DiscordRole[]> {
        return [...(await this.#cache.getAll(guildId)).values()];
    }

    public async getRole(guildId: bigint, userId: bigint): Promise<discordeno.DiscordRole | undefined> {
        return await this.#cache.get(guildId, userId);
    }

    public async deleteAllRoles(guildId?: bigint): Promise<void> {
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
        await this.#cache.setAll(BigInt(guild.id), guild.roles.map(r => [BigInt(r.id), r]));
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

    async #handleGuildRoleCreate(message: discordeno.DiscordGuildRoleCreate): Promise<void> {
        await this.#cache.set(BigInt(message.guild_id), BigInt(message.role.id), message.role);
    }

    async #handleGuildRoleUpdate(message: discordeno.DiscordGuildRoleUpdate): Promise<void> {
        await this.#cache.set(BigInt(message.guild_id), BigInt(message.role.id), message.role);
    }

    async #handleGuildRoleDelete(role: discordeno.DiscordGuildRoleDelete): Promise<void> {
        await this.#cache.delete(BigInt(role.guild_id), BigInt(role.role_id));
    }
}
