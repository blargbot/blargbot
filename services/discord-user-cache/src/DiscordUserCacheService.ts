import type Discord from '@blargbot/discord-types';
import type { MessageHandle } from '@blargbot/message-broker';
import type { IKVCache } from '@blargbot/redis-cache';

import type { DiscordUserCacheMessageBroker } from './DiscordUserCacheMessageBroker.js';

export class DiscordUserCacheService {
    readonly #messages: DiscordUserCacheMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #userCache: IKVCache<bigint, Discord.APIUser>;
    readonly #selfCache: IKVCache<'@self', bigint>;

    public constructor(
        messages: DiscordUserCacheMessageBroker,
        userCache: IKVCache<bigint, Discord.APIUser>,
        selfCache: IKVCache<'@self', bigint>
    ) {
        this.#messages = messages;
        this.#userCache = userCache;
        this.#selfCache = selfCache;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleGuildCreate(this.#handleGuildCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildMemberAdd(this.#handleGuildMemberAdd.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildMembersChunk(this.#handleGuildMembersChunk.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleUserUpdate(this.#handleUserUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleReady(this.#handleReady.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildBanAdd(this.#handleGuildBanAdd.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildBanRemove(this.#handleGuildBanRemove.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleInteractionCreate(this.#handleInteractionCreate.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    public async getUser(userId: bigint): Promise<Discord.APIUser | undefined> {
        return await this.#userCache.get(userId);
    }

    public async getSelf(): Promise<Discord.APIUser | undefined> {
        const selfId = await this.#selfCache.get('@self');
        if (selfId === undefined)
            return undefined;
        return await this.#userCache.get(selfId);
    }

    public async clear(): Promise<void> {
        await this.#userCache.clear();
    }

    public async getUserCount(): Promise<number> {
        return await this.#userCache.size();
    }

    async #upsertGuild(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await Promise.all(guild.members
            .filter(hasUser)
            .map(u => this.#userCache.set(BigInt(u.user.id), u.user))
        );
    }

    async #handleGuildCreate(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#upsertGuild(guild);
    }

    async #handleGuildMemberAdd(member: Discord.GatewayGuildMemberAddDispatchData): Promise<void> {
        if (!hasUser(member))
            return;
        await this.#userCache.set(BigInt(member.user.id), member.user);
    }

    async #handleGuildMembersChunk(chunk: Discord.GatewayGuildMembersChunkDispatchData): Promise<void> {
        await Promise.all(chunk.members
            .filter(hasUser)
            .map(u => this.#userCache.set(BigInt(u.user.id), u.user))
        );
    }

    async #handleUserUpdate(message: Discord.GatewayUserUpdateDispatchData): Promise<void> {
        await this.#userCache.set(BigInt(message.id), message);
    }

    async #handleReady(message: Discord.GatewayReadyDispatchData): Promise<void> {
        await Promise.all([
            this.#userCache.set(BigInt(message.user.id), message.user),
            this.#selfCache.set('@self', BigInt(message.user.id))
        ]);
    }

    async #handleGuildBanAdd(message: Discord.GatewayGuildBanAddDispatchData): Promise<void> {
        await this.#userCache.set(BigInt(message.user.id), message.user);
    }

    async #handleGuildBanRemove(message: Discord.GatewayGuildBanRemoveDispatchData): Promise<void> {
        await this.#userCache.set(BigInt(message.user.id), message.user);
    }

    async #handleInteractionCreate(message: Discord.GatewayInteractionCreateDispatchData): Promise<void> {
        if (message.user === undefined)
            return;

        await this.#userCache.set(BigInt(message.user.id), message.user);
    }
}

function hasUser<T extends { user?: unknown; }>(member: T): member is T & { user: Exclude<T['user'], undefined>; } {
    return member.user !== undefined;
}
