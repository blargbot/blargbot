import { hasValue } from '@blargbot/guards';
import type { MessageHandle } from '@blargbot/message-broker';
import type { IKSCache, IKVCache } from '@blargbot/redis-cache';
import type * as discordeno from 'discordeno';

import type { DiscordChannelCacheMessageBroker } from './DiscordChannelCacheMessageBroker.js';

export class DiscordChannelCacheService {
    readonly #messages: DiscordChannelCacheMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #channelCache: IKVCache<bigint, discordeno.DiscordChannel>;
    readonly #guildIndex: IKSCache<bigint, bigint>;

    public constructor(
        messages: DiscordChannelCacheMessageBroker,
        channelCache: IKVCache<bigint, discordeno.DiscordChannel>,
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

    public async getChannel(channelId: bigint): Promise<discordeno.DiscordChannel | undefined> {
        return await this.#channelCache.get(channelId);
    }

    public async getGuildChannel(guildId: bigint, channelId: bigint): Promise<discordeno.DiscordChannel | undefined> {
        if (!await this.#guildIndex.has(guildId, channelId))
            return undefined;
        return await this.#channelCache.get(channelId);
    }

    public async getGuildChannels(guildId: bigint): Promise<discordeno.DiscordChannel[]> {
        const channelIds = await this.#guildIndex.list(guildId);
        return (await Promise.all(channelIds.map(c => this.#channelCache.get(c)))).filter(hasValue);
    }

    public async deleteGuild(guildId: bigint): Promise<void> {
        await this.#clearCache(guildId);
    }

    async #addChannels(channels: discordeno.DiscordChannel[], guildId?: string): Promise<void> {
        const promises = channels.map(c => this.#channelCache.set(BigInt(c.id), { ...c, guild_id: guildId }));
        if (guildId !== undefined)
            promises.push(this.#guildIndex.addAll(BigInt(guildId), channels.map(c => BigInt(c.id))));
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

    async #deleteChannel(channel: discordeno.DiscordChannel): Promise<void> {
        const channelId = BigInt(channel.id);
        const promises = [this.#channelCache.delete(channelId)];
        if (channel.guild_id !== undefined)
            promises.push(this.#guildIndex.remove(BigInt(channel.guild_id), channelId));
        await Promise.all(promises);
    }

    async #handleGuildCreate(message: discordeno.DiscordGuild): Promise<void> {
        await this.#clearCache(BigInt(message.id));
        await this.#addChannels([...message.channels ?? [], ...message.threads ?? []], message.id);
    }

    async #handleGuildDelete(message: discordeno.DiscordUnavailableGuild): Promise<void> {
        await this.#clearCache(BigInt(message.id));
    }

    async #handleChannelCreate(message: discordeno.DiscordChannel): Promise<void> {
        await this.#addChannels([message], message.guild_id);
    }

    async #handleChannelDelete(message: discordeno.DiscordChannel): Promise<void> {
        await this.#deleteChannel(message);
    }

    async #handleChannelUpdate(message: discordeno.DiscordChannel): Promise<void> {
        await this.#addChannels([message], message.guild_id);
    }

    async #handleThreadCreate(message: discordeno.DiscordChannel): Promise<void> {
        await this.#addChannels([message], message.guild_id);
    }

    async #handleThreadDelete(message: discordeno.DiscordChannel): Promise<void> {
        await this.#deleteChannel(message);
    }

    async #handleThreadListSync(message: discordeno.DiscordThreadListSync): Promise<void> {
        await this.#addChannels(message.threads);
    }

    async #handleThreadUpdate(message: discordeno.DiscordChannel): Promise<void> {
        await this.#addChannels([message], message.guild_id);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }
}
