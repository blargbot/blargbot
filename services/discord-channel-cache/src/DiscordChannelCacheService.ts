import type Discord from '@blargbot/discord-types';
import { isGuildChannel } from '@blargbot/discord-util';
import { hasValue } from '@blargbot/guards';
import type { IKSCache, IKVCache } from '@blargbot/redis-cache';

export class DiscordChannelCacheService {
    readonly #channelCache: IKVCache<bigint, Discord.APIChannel>;
    readonly #guildIndex: IKSCache<bigint, bigint>;
    readonly #channelGuildMap: IKVCache<bigint, bigint>;

    public constructor(
        channelCache: IKVCache<bigint, Discord.APIChannel>,
        guildIndex: IKSCache<bigint, bigint>,
        channelGuildMap: IKVCache<bigint, bigint>
    ) {
        this.#channelCache = channelCache;
        this.#guildIndex = guildIndex;
        this.#channelGuildMap = channelGuildMap;
    }

    public async getChannel(channelId: bigint): Promise<Discord.APIChannel | undefined> {
        return await this.#channelCache.get(channelId);
    }

    public async getChannelGuild(channelId: bigint): Promise<bigint | undefined> {
        return await this.#channelGuildMap.get(channelId);
    }

    public async getGuildChannel(guildId: bigint, channelId: bigint): Promise<Discord.APIChannel | undefined> {
        if (!await this.#guildIndex.has(guildId, channelId))
            return undefined;
        return await this.#channelCache.get(channelId);
    }

    public async getGuildChannels(guildId: bigint): Promise<Discord.APIChannel[]> {
        const channelIds = await this.#guildIndex.list(guildId);
        return (await Promise.all(channelIds.map(c => this.#channelCache.get(c)))).filter(hasValue);
    }

    public async deleteGuild(guildId: bigint): Promise<void> {
        await this.#clearCache(guildId);
    }

    async #addChannels(channels: Discord.APIChannel[], guildId?: string): Promise<void> {
        const promises = [this.#channelCache.setAll(channels.map(c => [BigInt(c.id), c]))];
        const channelGuildMap = new Map<bigint, bigint>();
        if (guildId !== undefined) {
            const id = BigInt(guildId);
            for (const channel of channels)
                channelGuildMap.set(BigInt(channel.id), id);
        } else {
            for (const channel of channels)
                if (isGuildChannel(channel) && channel.guild_id !== undefined)
                    channelGuildMap.set(BigInt(channel.id), BigInt(channel.guild_id));
        }
        if (channelGuildMap.size > 0)
            promises.push(this.#channelGuildMap.setAll(channelGuildMap));

        const byGuild = channels.reduce<Partial<Record<string, bigint[]>>>((acc, c) => {
            if (isGuildChannel(c) && c.guild_id !== undefined)
                (acc[c.guild_id] ??= []).push(BigInt(c.id));
            return acc;
        }, {});
        for (const [guildId, channels = []] of Object.entries(byGuild))
            promises.push(this.#guildIndex.addAll(BigInt(guildId), channels));
        await Promise.all(promises);
    }

    async #clearCache(guildId: bigint): Promise<void> {
        const channels = await this.#guildIndex.list(guildId);
        if (channels.length === 0)
            return;

        await Promise.all([
            this.#guildIndex.clear(guildId),
            channels.map(c => this.#channelCache.delete(c)),
            channels.map(c => this.#channelGuildMap.delete(c))
        ]);
    }

    async #deleteChannel(channel: Discord.APIChannel): Promise<void> {
        const channelId = BigInt(channel.id);
        const promises = [
            this.#channelCache.delete(channelId),
            this.#channelGuildMap.delete(channelId)
        ];
        if (isGuildChannel(channel) && channel.guild_id !== undefined)
            promises.push(this.#guildIndex.remove(BigInt(channel.guild_id), channelId));
        await Promise.all(promises);
    }

    public async handleGuildCreate(message: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#clearCache(BigInt(message.id));
        await this.#addChannels([...message.channels, ...message.threads], message.id);
    }

    public async handleGuildDelete(message: Discord.GatewayGuildDeleteDispatchData): Promise<void> {
        await this.#clearCache(BigInt(message.id));
    }

    public async handleChannelCreate(message: Discord.GatewayChannelCreateDispatchData): Promise<void> {
        await this.#addChannels([message]);
    }

    public async handleChannelDelete(message: Discord.GatewayChannelDeleteDispatchData): Promise<void> {
        await this.#deleteChannel(message);
    }

    public async handleChannelUpdate(message: Discord.GatewayChannelUpdateDispatchData): Promise<void> {
        await this.#addChannels([message]);
    }

    public async handleThreadCreate(message: Discord.APIChannel): Promise<void> {
        await this.#addChannels([message]);
    }

    public async handleThreadDelete(message: Discord.GatewayThreadDeleteDispatchData): Promise<void> {
        await this.#deleteChannel(message);
    }

    public async handleThreadListSync(message: Discord.GatewayThreadListSyncDispatchData): Promise<void> {
        await this.#addChannels(message.threads, message.guild_id);
    }

    public async handleThreadUpdate(message: Discord.GatewayThreadUpdateDispatchData): Promise<void> {
        await this.#addChannels([message]);
    }
}
