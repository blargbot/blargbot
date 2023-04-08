import type { DiscordChannelCacheMessageBroker } from '@blargbot/discord-channel-cache-client';
import type Discord from '@blargbot/discord-types';
import { isGuildChannel } from '@blargbot/discord-util';
import { hasValue } from '@blargbot/guards';
import type { IKSCache, IKVCache } from '@blargbot/redis-cache';

export class DiscordChannelCacheService {
    readonly #channelCache: IKVCache<bigint, Discord.APIChannel>;
    readonly #guildIndex: IKSCache<bigint, bigint>;
    readonly #channelGuildMap: IKVCache<bigint, bigint>;
    readonly #messages: DiscordChannelCacheMessageBroker;

    public constructor(
        channelCache: IKVCache<bigint, Discord.APIChannel>,
        guildIndex: IKSCache<bigint, bigint>,
        channelGuildMap: IKVCache<bigint, bigint>,
        messages: DiscordChannelCacheMessageBroker
    ) {
        this.#channelCache = channelCache;
        this.#guildIndex = guildIndex;
        this.#channelGuildMap = channelGuildMap;
        this.#messages = messages;
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
        await this.#deleteGuild(guildId);
    }

    #ensureGuildId(channels: Iterable<Discord.APIChannel>, guildId?: string): void {
        if (guildId === undefined)
            return;

        for (const channel of channels) {
            if (isGuildChannel(channel)) {
                channel.guild_id ??= guildId;
            }
        }
    }

    async #addChannels(channels: Discord.APIChannel[], guildId?: string): Promise<void> {
        await Promise.all(this.#addChannelsIter(channels, guildId));
    }

    * #addChannelsIter(channels: Discord.APIChannel[], guildId?: string): Iterable<Awaitable<unknown>> {
        this.#ensureGuildId(channels, guildId);
        yield this.#channelCache.setAll(channels.map(c => [BigInt(c.id), c]));
        yield* channels.map(c => this.#messages.postChannel(c));
        const channelGuildMap = channels
            .filter(isGuildChannel)
            .map(c => [BigInt(c.id), BigInt(c.guild_id as string)] as const);
        if (channelGuildMap.length === 0)
            return;

        yield this.#channelGuildMap.setAll(channelGuildMap);
        const byGuild: Partial<Record<string, bigint[]>> = {};
        for (const [guildId, channelId] of channelGuildMap)
            (byGuild[guildId.toString()] ??= []).push(channelId);
        for (const [guildId, channels = []] of Object.entries(byGuild))
            yield this.#guildIndex.addAll(BigInt(guildId), channels);
    }

    async #deleteGuild(guildId: bigint): Promise<void> {
        const channels = await this.#guildIndex.list(guildId);
        if (channels.length === 0)
            return;

        await Promise.all(this.#deleteGuildIter(channels, guildId));
    }

    * #deleteGuildIter(channels: readonly bigint[], guildId: bigint): Iterable<Awaitable<unknown>> {
        yield this.#guildIndex.clear(guildId);
        yield* channels.map(c => this.#channelGuildMap.delete(c));
        yield* channels.map(async c => {
            const channel = await this.#channelCache.pop(c);
            if (channel !== undefined)
                await this.#messages.deleteChannel(channel);
        });
    }

    async #deleteChannel(channel: Discord.APIChannel): Promise<void> {
        await Promise.all(this.#deleteChannelIter(channel));
    }

    * #deleteChannelIter(channel: Discord.APIChannel): Iterable<Awaitable<unknown>> {
        const channelId = BigInt(channel.id);
        yield this.#channelCache.delete(channelId);
        yield this.#channelGuildMap.delete(channelId);
        yield this.#messages.deleteChannel(channel);
        if (isGuildChannel(channel) && channel.guild_id !== undefined)
            yield this.#guildIndex.remove(BigInt(channel.guild_id), channelId);
    }

    public async handleGuildCreate(message: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#deleteGuild(BigInt(message.id));
        await this.#addChannels([...message.channels, ...message.threads], message.id);
    }

    public async handleGuildDelete(message: Discord.GatewayGuildDeleteDispatchData): Promise<void> {
        await this.#deleteGuild(BigInt(message.id));
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
