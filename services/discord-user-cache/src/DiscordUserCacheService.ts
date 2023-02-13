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
            this.#messages.handleGuildMemberAdd(this.#handleGuildMemberAdd.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildMembersChunk(this.#handleGuildMembersChunk.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleUserUpdate(this.#handleUserUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleReady(this.#handleReady.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildBanAdd(this.#handleGuildBanAdd.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildBanRemove(this.#handleGuildBanRemove.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleInteractionCreate(this.#handleInteractionCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handlePresenceUpdate(this.#handlePresenceUpdate.bind(this)).then(h => this.#handles.add(h))
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

    async #handleGuildMemberAdd(member: discordeno.DiscordGuildMemberAdd): Promise<void> {
        await this.#cache.set(BigInt(member.user.id), member.user);
    }

    async #handleGuildMembersChunk(chunk: discordeno.DiscordGuildMembersChunk): Promise<void> {
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

    async #handleGuildBanAdd(message: discordeno.DiscordGuildBanAddRemove): Promise<void> {
        await this.#cache.set(BigInt(message.user.id), message.user);
    }

    async #handleGuildBanRemove(message: discordeno.DiscordGuildBanAddRemove): Promise<void> {
        await this.#cache.set(BigInt(message.user.id), message.user);
    }

    async #handleInteractionCreate(message: discordeno.DiscordInteraction): Promise<void> {
        if (message.user === undefined)
            return;

        await this.#cache.set(BigInt(message.user.id), message.user);
    }

    async #handlePresenceUpdate(message: discordeno.DiscordPresenceUpdate): Promise<void> {
        await this.#cache.set(BigInt(message.user.id), message.user);
    }

}

function hasUser<T extends discordeno.DiscordMember>(member: T): member is T & discordeno.DiscordMemberWithUser {
    return member.user !== undefined;
}
