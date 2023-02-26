import type Discord from '@blargbot/discord-types';
import { hasValue } from '@blargbot/guards';
import type { MessageHandle } from '@blargbot/message-broker';
import type { IKSCache, IKVCache } from '@blargbot/redis-cache';

import type { DiscordChannelCacheMessageBroker } from './DiscordChannelCacheMessageBroker.js';

export class DiscordChannelCacheService {
    readonly #messages: DiscordChannelCacheMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #channelCache: IKVCache<bigint, Discord.APIChannel>;
    readonly #guildIndex: IKSCache<bigint, bigint>;

    public constructor(
        messages: DiscordChannelCacheMessageBroker,
        channelCache: IKVCache<bigint, Discord.APIChannel>,
        guildIndex: IKSCache<bigint, bigint>
    ) {
        this.#messages = messages;
        this.#channelCache = channelCache;
        this.#guildIndex = guildIndex;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleGuildCreate(this.#handleGuildCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleGuildDelete(this.#handleGuildDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleChannelCreate(this.#handleChannelCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleChannelDelete(this.#handleChannelDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleChannelUpdate(this.#handleChannelUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleThreadCreate(this.#handleThreadCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleThreadDelete(this.#handleThreadDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleThreadListSync(this.#handleThreadListSync.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleThreadUpdate(this.#handleThreadUpdate.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async getChannel(channelId: bigint): Promise<Discord.APIChannel | undefined> {
        return await this.#channelCache.get(channelId);
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

    async #addChannels(channels: Discord.APIChannel[]): Promise<void> {
        const promises = [this.#channelCache.setAll(channels.map(c => [BigInt(c.id), c]))];
        const byGuild = channels.reduce<Record<string, bigint[]>>((acc, c) => {
            if ('guild_id' in c && c.guild_id !== undefined)
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
            channels.map(c => this.#channelCache.delete(c))
        ]);
    }

    async #deleteChannel(channel: Discord.APIChannel): Promise<void> {
        const channelId = BigInt(channel.id);
        const promises = [this.#channelCache.delete(channelId)];
        if ('guild_id' in channel && channel.guild_id !== undefined)
            promises.push(this.#guildIndex.remove(BigInt(channel.guild_id), channelId));
        await Promise.all(promises);
    }

    async #handleGuildCreate(message: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#clearCache(BigInt(message.id));
        await this.#addChannels([...message.channels, ...message.threads]);
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
        await this.#addChannels(message.threads);
    }

    async #handleThreadUpdate(message: Discord.GatewayThreadUpdateDispatchData): Promise<void> {
        await this.#addChannels([message]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }
}
