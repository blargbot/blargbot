import type { MessageHandle } from '@blargbot/message-broker';
import type { IKVCache } from '@blargbot/redis-cache';
import type * as discordeno from 'discordeno';

import type { DiscordUserCacheMessageBroker } from './DiscordUserCacheMessageBroker.js';

export class DiscordUserCacheService {
    readonly #messages: DiscordUserCacheMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #cache: IKVCache<bigint, discordeno.DiscordUser>;

    public constructor(messages: DiscordUserCacheMessageBroker, cache: IKVCache<bigint, discordeno.DiscordUser>) {
        this.#messages = messages;
        this.#cache = cache;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleGuildCreate(this.#handleGuildCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildUpdate(this.#handleGuildUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleMemberAdd(this.#handleMemberAdd.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleMembersChunk(this.#handleMembersChunk.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleUserUpdate(this.#handleUserUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleReady(this.#handleReady.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleBanAdd(this.#handleBanAdd.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleBanRemove(this.#handleBanRemove.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleInteraction(this.#handleInteraction.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handlePresence(this.#handlePresence.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    public async getUser(userId: bigint): Promise<discordeno.DiscordUser | undefined> {
        return await this.#cache.get(userId);
    }

    public async clear(): Promise<void> {
        await this.#cache.clear();
    }

    public async getUserCount(): Promise<number> {
        return await this.#cache.size();
    }

    async #upsertGuild(guild: discordeno.DiscordGuild): Promise<void> {
        if (guild.members === undefined)
            return;

        await Promise.all(guild.members
            .filter(hasUser)
            .map(u => this.#cache.set(BigInt(u.user.id), u.user))
        );
    }

    async #handleGuildCreate(guild: discordeno.DiscordGuild): Promise<void> {
        await this.#upsertGuild(guild);
    }

    async #handleGuildUpdate(guild: discordeno.DiscordGuild): Promise<void> {
        await this.#upsertGuild(guild);
    }

    async #handleMemberAdd(member: discordeno.DiscordGuildMemberAdd): Promise<void> {
        await this.#cache.set(BigInt(member.user.id), member.user);
    }

    async #handleMembersChunk(chunk: discordeno.DiscordGuildMembersChunk): Promise<void> {
        await Promise.all(chunk.members
            .map(u => this.#cache.set(BigInt(u.user.id), u.user))
        );
    }

    async #handleUserUpdate(message: discordeno.DiscordUser): Promise<void> {
        await this.#cache.set(BigInt(message.id), message);
    }

    async #handleReady(message: discordeno.DiscordReady): Promise<void> {
        await this.#cache.set(BigInt(message.user.id), message.user);
    }

    async #handleBanAdd(message: discordeno.DiscordGuildBanAddRemove): Promise<void> {
        await this.#cache.set(BigInt(message.user.id), message.user);
    }

    async #handleBanRemove(message: discordeno.DiscordGuildBanAddRemove): Promise<void> {
        await this.#cache.set(BigInt(message.user.id), message.user);
    }

    async #handleInteraction(message: discordeno.DiscordInteraction): Promise<void> {
        if (message.user === undefined)
            return;

        await this.#cache.set(BigInt(message.user.id), message.user);
    }

    async #handlePresence(message: discordeno.DiscordPresenceUpdate): Promise<void> {
        await this.#cache.set(BigInt(message.user.id), message.user);
    }

}

function hasUser<T extends discordeno.DiscordMember>(member: T): member is T & discordeno.DiscordMemberWithUser {
    return member.user !== undefined;
}
