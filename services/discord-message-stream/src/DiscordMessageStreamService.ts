import { DiscordChannelCacheHttpClient } from '@blargbot/discord-channel-cache-client';
import { DiscordGuildCacheHttpClient } from '@blargbot/discord-guild-cache-client';
import type { DiscordMessageStreamMessageBroker } from '@blargbot/discord-message-stream-client';
import { DiscordRoleCacheHttpClient } from '@blargbot/discord-role-cache-client';
import type Discord from '@blargbot/discord-types';
import type { Counter, Metrics } from '@blargbot/metrics-client';

export class DiscordMessageStreamService {
    readonly #messages: DiscordMessageStreamMessageBroker;
    readonly #discordChannelCache: DiscordChannelCacheHttpClient;
    readonly #discordGuildCache: DiscordGuildCacheHttpClient;
    readonly #discordRoleCache: DiscordRoleCacheHttpClient;
    readonly #messageCount: Counter;

    public constructor(messages: DiscordMessageStreamMessageBroker, metrics: Metrics, options: DiscordMessageStreamServiceOptions) {
        this.#messageCount = metrics.counter({
            name: 'bot_message_counter',
            help: 'Messages the bot sees'
        });
        this.#messages = messages;
        this.#discordChannelCache = DiscordChannelCacheHttpClient.from(options.discordChannelCacheClient ?? options.discordChannelCacheUrl);
        this.#discordGuildCache = DiscordGuildCacheHttpClient.from(options.discordGuildCacheClient ?? options.discordGuildCacheUrl);
        this.#discordRoleCache = DiscordRoleCacheHttpClient.from(options.discordRoleCacheClient ?? options.discordRoleCacheUrl);
    }

    public async handleMessageCreate(message: Discord.GatewayMessageCreateDispatchData): Promise<void> {
        this.#messageCount.inc();

        const [channel, guild] = await Promise.all([
            this.#discordChannelCache.getChannel({ channelId: message.channel_id }),
            this.#getGuildForChannel(message.channel_id)
        ]);

        if (channel === undefined)
            return;

        await this.#messages.pushMessage(Object.assign(message, { channel, guild }));
    }

    async #getGuildForChannel(channelId: string): Promise<Discord.APIGuild | undefined> {
        const guildId = await this.#discordChannelCache.getChannelGuild({ channelId });
        if (guildId === undefined)
            return undefined;
        const roles = this.#discordRoleCache.getGuildRoles({ guildId });
        const guild = await this.#discordGuildCache.getGuild({ guildId });
        if (guild === undefined)
            return undefined;

        return {
            ...guild,
            roles: await roles,
            emojis: [],
            stickers: []
        };
    }
}

export interface DiscordMessageStreamServiceOptions {
    readonly discordChannelCacheUrl?: string;
    readonly discordChannelCacheClient?: DiscordChannelCacheHttpClient;
    readonly discordGuildCacheUrl?: string;
    readonly discordGuildCacheClient?: DiscordGuildCacheHttpClient;
    readonly discordRoleCacheUrl?: string;
    readonly discordRoleCacheClient?: DiscordRoleCacheHttpClient;
}
