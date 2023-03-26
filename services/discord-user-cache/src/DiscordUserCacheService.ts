import type Discord from '@blargbot/discord-types';
import type { IKVCache } from '@blargbot/redis-cache';

export class DiscordUserCacheService {
    readonly #userCache: IKVCache<bigint, Discord.APIUser>;
    readonly #selfCache: IKVCache<'@self', bigint>;

    public constructor(
        userCache: IKVCache<bigint, Discord.APIUser>,
        selfCache: IKVCache<'@self', bigint>
    ) {
        this.#userCache = userCache;
        this.#selfCache = selfCache;
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

    public async handleGuildCreate(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#upsertGuild(guild);
    }

    public async handleGuildMemberAdd(member: Discord.GatewayGuildMemberAddDispatchData): Promise<void> {
        if (!hasUser(member))
            return;
        await this.#userCache.set(BigInt(member.user.id), member.user);
    }

    public async handleGuildMembersChunk(chunk: Discord.GatewayGuildMembersChunkDispatchData): Promise<void> {
        await Promise.all(chunk.members
            .filter(hasUser)
            .map(u => this.#userCache.set(BigInt(u.user.id), u.user))
        );
    }

    public async handleUserUpdate(message: Discord.GatewayUserUpdateDispatchData): Promise<void> {
        await this.#userCache.set(BigInt(message.id), message);
    }

    public async handleReady(message: Discord.GatewayReadyDispatchData): Promise<void> {
        await Promise.all([
            this.#userCache.set(BigInt(message.user.id), message.user),
            this.#selfCache.set('@self', BigInt(message.user.id))
        ]);
    }

    public async handleGuildBanAdd(message: Discord.GatewayGuildBanAddDispatchData): Promise<void> {
        await this.#userCache.set(BigInt(message.user.id), message.user);
    }

    public async handleGuildBanRemove(message: Discord.GatewayGuildBanRemoveDispatchData): Promise<void> {
        await this.#userCache.set(BigInt(message.user.id), message.user);
    }

    public async handleInteractionCreate(message: Discord.GatewayInteractionCreateDispatchData): Promise<void> {
        if (message.user === undefined)
            return;

        await this.#userCache.set(BigInt(message.user.id), message.user);
    }
}

function hasUser<T extends { user?: unknown; }>(member: T): member is T & { user: Exclude<T['user'], undefined>; } {
    return member.user !== undefined;
}
