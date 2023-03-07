import type { PartialDiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import type { MessageHandle } from '@blargbot/message-hub';
import fetch from 'node-fetch';

import type { DiscordMessageStreamMessageBroker } from './DiscordMessageStreamMessageBroker.js';

type DiscordGatewayMessageBroker = PartialDiscordGatewayMessageBroker<
    | 'MESSAGE_CREATE'
>;

export class DiscordMessageStreamService {
    readonly #messages: DiscordMessageStreamMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #discordChannelCache: string;
    readonly #discordGuildCache: string;
    readonly #gateway: DiscordGatewayMessageBroker;

    public constructor(messages: DiscordMessageStreamMessageBroker, gateway: DiscordGatewayMessageBroker, options: DiscordMessageStreamServiceOptions) {
        this.#messages = messages;
        this.#gateway = gateway;
        this.#discordChannelCache = options.discordChannelCacheUrl;
        this.#discordGuildCache = options.discordGuildCacheUrl;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#gateway.handleMessageCreate(this.#handleMessageCreate.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    async #handleMessageCreate(message: Discord.GatewayMessageCreateDispatchData): Promise<void> {
        const [channel, guild] = await Promise.all([
            this.#getChannel(message.channel_id),
            this.#getGuildForChannel(message.channel_id)
        ]);

        if (channel === undefined)
            return;

        await this.#messages.pushMessage(Object.assign(message, { channel, guild }));
    }

    async #getChannel(channelId: string): Promise<Discord.APIChannel | undefined> {
        const channelResponse = await fetch(new URL(channelId, this.#discordChannelCache).toString());
        if (channelResponse.status !== 200)
            return undefined;
        return await channelResponse.json() as Discord.APIChannel;
    }

    async #getGuildForChannel(channelId: string): Promise<Discord.APIGuild | undefined> {
        const channelResponse = await fetch(new URL(`${channelId}/guild-id`, this.#discordChannelCache).toString());
        if (channelResponse.status !== 200)
            return undefined;
        const { guildId } = await channelResponse.json() as { guildId: string; };
        const guildResponse = await fetch(new URL(guildId, this.#discordGuildCache).toString());
        if (guildResponse.status !== 200)
            return undefined;
        return await guildResponse.json() as Discord.APIGuild;
    }
}

export interface DiscordMessageStreamServiceOptions {
    readonly discordChannelCacheUrl: string;
    readonly discordGuildCacheUrl: string;
}
