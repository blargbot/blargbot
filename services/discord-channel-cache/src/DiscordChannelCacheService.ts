import type { PartialDiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import { isGuildChannel } from '@blargbot/discord-util';
import { hasValue } from '@blargbot/guards';
import type { MessageHandle } from '@blargbot/message-hub';
import type { IKSCache, IKVCache } from '@blargbot/redis-cache';

type DiscordGatewayMessageBroker = PartialDiscordGatewayMessageBroker<
    | 'GUILD_CREATE'
    | 'GUILD_DELETE'
    | 'CHANNEL_CREATE'
    | 'CHANNEL_UPDATE'
    | 'CHANNEL_DELETE'
    | 'THREAD_CREATE'
    | 'THREAD_UPDATE'
    | 'THREAD_DELETE'
    | 'THREAD_LIST_SYNC'
>;

export class DiscordChannelCacheService {
    readonly #gateway: DiscordGatewayMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #channelCache: IKVCache<bigint, Discord.APIChannel>;
    readonly #guildIndex: IKSCache<bigint, bigint>;
    readonly #channelGuildMap: IKVCache<bigint, bigint>;

    public constructor(
        gateway: DiscordGatewayMessageBroker,
        channelCache: IKVCache<bigint, Discord.APIChannel>,
        guildIndex: IKSCache<bigint, bigint>,
        channelGuildMap: IKVCache<bigint, bigint>
    ) {
        this.#gateway = gateway;
        this.#channelCache = channelCache;
        this.#guildIndex = guildIndex;
        this.#channelGuildMap = channelGuildMap;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#gateway.handleGuildCreate(this.#handleGuildCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleGuildDelete(this.#handleGuildDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleChannelCreate(this.#handleChannelCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleChannelDelete(this.#handleChannelDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleChannelUpdate(this.#handleChannelUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleThreadCreate(this.#handleThreadCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleThreadDelete(this.#handleThreadDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleThreadListSync(this.#handleThreadListSync.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleThreadUpdate(this.#handleThreadUpdate.bind(this)).then(h => this.#handles.add(h))
        ]);
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

        const byGuild = channels.reduce<Record<string, bigint[]>>((acc, c) => {
            if (isGuildChannel(c) && c.guild_id !== undefined)
                (acc[c.guild_id] ??= []).push(BigInt(c.id));
            return acc;
        }, {});
        for (const [guildId, channels] of Object.entries(byGuild))
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

    async #handleGuildCreate(message: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#clearCache(BigInt(message.id));
        await this.#addChannels([...message.channels, ...message.threads], message.id);
    }

    async #handleGuildDelete(message: Discord.GatewayGuildDeleteDispatchData): Promise<void> {
        await this.#clearCache(BigInt(message.id));
    }

    async #handleChannelCreate(message: Discord.GatewayChannelCreateDispatchData): Promise<void> {
        await this.#addChannels([message]);
    }

    async #handleChannelDelete(message: Discord.GatewayChannelDeleteDispatchData): Promise<void> {
        await this.#deleteChannel(message);
    }

    async #handleChannelUpdate(message: Discord.GatewayChannelUpdateDispatchData): Promise<void> {
        await this.#addChannels([message]);
    }

    async #handleThreadCreate(message: Discord.APIChannel): Promise<void> {
        await this.#addChannels([message]);
    }

    async #handleThreadDelete(message: Discord.GatewayThreadDeleteDispatchData): Promise<void> {
        await this.#deleteChannel(message);
    }

    async #handleThreadListSync(message: Discord.GatewayThreadListSyncDispatchData): Promise<void> {
        await this.#addChannels(message.threads, message.guild_id);
    }

    async #handleThreadUpdate(message: Discord.GatewayThreadUpdateDispatchData): Promise<void> {
        await this.#addChannels([message]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }
}
