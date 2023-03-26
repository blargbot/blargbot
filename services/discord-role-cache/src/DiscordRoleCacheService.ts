import type Discord from '@blargbot/discord-types';
import type { IKKVCache } from '@blargbot/redis-cache';

export class DiscordRoleCacheService {
    readonly #cache: IKKVCache<bigint, bigint, Discord.APIRole>;

    public constructor(cache: IKKVCache<bigint, bigint, Discord.APIRole>) {
        this.#cache = cache;
    }

    public async getAllRoles(guildId: bigint): Promise<Discord.APIRole[]> {
        return [...(await this.#cache.getAll(guildId)).values()];
    }

    public async getRole(guildId: bigint, userId: bigint): Promise<Discord.APIRole | undefined> {
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

    async #upsertGuild(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#cache.setAll(BigInt(guild.id), guild.roles.map(r => [BigInt(r.id), r]));
    }

    public async handleGuildCreate(guild: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#upsertGuild(guild);
    }

    public async handleGuildDelete(guild: Discord.GatewayGuildDeleteDispatchData): Promise<void> {
        await this.#cache.deleteAll(BigInt(guild.id));
    }

    public async handleGuildRoleCreate(message: Discord.GatewayGuildRoleCreateDispatchData): Promise<void> {
        await this.#cache.set(BigInt(message.guild_id), BigInt(message.role.id), message.role);
    }

    public async handleGuildRoleUpdate(message: Discord.GatewayGuildRoleUpdateDispatchData): Promise<void> {
        await this.#cache.set(BigInt(message.guild_id), BigInt(message.role.id), message.role);
    }

    public async handleGuildRoleDelete(role: Discord.GatewayGuildRoleDeleteDispatchData): Promise<void> {
        await this.#cache.delete(BigInt(role.guild_id), BigInt(role.role_id));
    }
}
