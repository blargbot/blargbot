import type { PartialDiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import type { MessageHandle } from '@blargbot/message-hub';
import type { IKKVCache } from '@blargbot/redis-cache';

import type { DiscordUserPresence } from './DiscordUserPresence.js';
import { toDiscordUserPresence } from './DiscordUserPresence.js';

type DiscordGatewayMessageBroker = PartialDiscordGatewayMessageBroker<
    | 'GUILD_CREATE'
    | 'GUILD_DELETE'
    | 'GUILD_MEMBER_REMOVE'
    | 'GUILD_MEMBERS_CHUNK'
    | 'PRESENCE_UPDATE'
>;

export class DiscordPresenceCacheService {
    readonly #gateway: DiscordGatewayMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #cache: IKKVCache<bigint, bigint, DiscordUserPresence>;

    public constructor(gateway: DiscordGatewayMessageBroker, cache: IKKVCache<bigint, bigint, DiscordUserPresence>) {
        this.#gateway = gateway;
        this.#cache = cache;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#gateway.handleGuildCreate(this.#handleGuildCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleGuildDelete(this.#handleGuildDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleGuildMembersChunk(this.#handleGuildMembersChunk.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleGuildMemberRemove(this.#handleGuildMemberRemove.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handlePresenceUpdate(this.#handlePresenceUpdate.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
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

    async #handlePresenceUpdate(message: Discord.GatewayPresenceUpdateDispatchData): Promise<void> {
        await this.#cache.set(BigInt(message.guild_id), BigInt(message.user.id), toDiscordUserPresence(message));
    }

    async #handleGuildCreate(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#cache.setAll(BigInt(guild.id), guild.presences.filter(hasUser).map(p => [BigInt(p.user.id), toDiscordUserPresence(p)]));
    }

    async #handleGuildDelete(guild: Discord.GatewayGuildDeleteDispatchData): Promise<void> {
        await this.#cache.deleteAll(BigInt(guild.id));
    }

    async #handleGuildMemberRemove(member: Discord.GatewayGuildMemberRemoveDispatchData): Promise<void> {
        await this.#cache.delete(BigInt(member.guild_id), BigInt(member.user.id));
    }

    async #handleGuildMembersChunk(chunk: Discord.GatewayGuildMembersChunkDispatchData): Promise<void> {
        if (chunk.presences === undefined)
            return;

        await this.#cache.setAll(BigInt(chunk.guild_id), chunk.presences.map(m => [BigInt(m.user.id), toDiscordUserPresence(m)]));
    }

}

function hasUser<T extends { user?: unknown; }>(member: T): member is T & { user: Exclude<T['user'], undefined>; } {
    return member.user !== undefined;
}
