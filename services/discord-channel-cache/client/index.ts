import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, readResponse } from '@blargbot/api-client';
import type Discord from '@blargbot/discord-types';
import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob, MessageHub } from '@blargbot/message-hub';

export type ChannelCacheChannelResponse = Discord.APIChannel;
export interface ChannelCacheGuildResponse {
    readonly guildId: string;
}

export interface ChannelCacheGuildRequestParams {
    readonly guildId: string | bigint;
}

export interface ChannelCacheChannelRequestParams {
    readonly channelId: string | bigint;
}
export interface ChannelCacheGuildChannelRequestParams extends ChannelCacheChannelRequestParams, ChannelCacheGuildRequestParams {

}

export class DiscordChannelCacheHttpClient extends defineApiClient({
    getChannel: b => b.route<ChannelCacheChannelRequestParams>(x => `${x.channelId}`)
        .response<ChannelCacheChannelResponse>(200)
        .response(404, () => undefined),
    getChannelGuild: b => b.route<ChannelCacheChannelRequestParams>(x => `${x.channelId}/guild-id`)
        .response(200, async b => (await readResponse<ChannelCacheGuildResponse>(b)).guildId)
        .response(404, () => undefined),
    getGuildChannels: b => b.route<ChannelCacheGuildRequestParams>(x => `guilds/${x.guildId}`)
        .response<ChannelCacheChannelResponse[]>(200),
    getGuildChannel: b => b.route<ChannelCacheGuildChannelRequestParams>(x => `guilds/${x.guildId}/${x.channelId}`)
        .response<ChannelCacheChannelResponse>(200),
    deleteGuild: b => b.route<ChannelCacheGuildRequestParams>('DELETE', x => `guilds/${x.guildId}`)
        .response(204)
}) {
    public static from(options: DiscordChannelCacheHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): DiscordChannelCacheHttpClient {
        if (options instanceof DiscordChannelCacheHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new DiscordChannelCacheHttpClient(options);
    }
}

const exchange = 'discord-channel-stream';
export class DiscordChannelCacheMessageBroker {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        this.#messages.onConnected(c => c.assertExchange(exchange, 'topic', { durable: true }));
    }

    public async postChannel(channel: Discord.APIChannel): Promise<void> {
        await this.#messages.publish(exchange, `set.${channel.id}`, await jsonToBlob(channel));
    }

    public async deleteChannel(channel: Discord.APIChannel): Promise<void> {
        await this.#messages.publish(exchange, `delete.${channel.id}`, await jsonToBlob(channel));
    }

    public async handleChannelSet(handler: (channel: Discord.APIChannel, message: ConsumeMessage) => Awaitable<void>, channelId?: bigint | string): Promise<MessageHandle> {
        const filter = `set.${channelId ?? '*'}`;
        return await this.#messages.handleMessage({
            exchange,
            filter,
            queue: MessageHub.makeQueueName(this.#serviceName, exchange, filter),
            handle: async (data, msg) => {
                await handler(await blobToJson(data), msg);
            }
        });
    }

    public async handleChannelDelete(handler: (channel: Discord.APIChannel, message: ConsumeMessage) => Awaitable<void>, channelId?: bigint | string): Promise<MessageHandle> {
        const filter = `delete.${channelId ?? '*'}`;
        return await this.#messages.handleMessage({
            exchange,
            filter,
            queue: MessageHub.makeQueueName(this.#serviceName, exchange, filter),
            handle: async (data, msg) => {
                await handler(await blobToJson(data), msg);
            }
        });
    }
}

export class DiscordChannelCacheClient {
    readonly #client: DiscordChannelCacheHttpClient;
    readonly #messages: DiscordChannelCacheMessageBroker;

    public constructor(options: DiscordChannelCacheClientOptions) {
        this.#client = DiscordChannelCacheHttpClient.from(options.http);
        this.#messages = 'hub' in options ? new DiscordChannelCacheMessageBroker(options.hub, options.serviceName) : options.broker;
    }

    public async getChannel(request: ChannelCacheChannelRequestParams, signal?: AbortSignal): Promise<ChannelCacheChannelResponse | undefined> {
        return await this.#client.getChannel(request, signal);
    }

    public async getChannelGuild(request: ChannelCacheChannelRequestParams, signal?: AbortSignal): Promise<string | undefined> {
        return await this.#client.getChannelGuild(request, signal);
    }

    public async getGuildChannels(request: ChannelCacheGuildRequestParams, signal?: AbortSignal): Promise<ChannelCacheChannelResponse[]> {
        return await this.#client.getGuildChannels(request, signal);
    }

    public async getGuildChannel(request: ChannelCacheGuildChannelRequestParams, signal?: AbortSignal): Promise<ChannelCacheChannelResponse> {
        return await this.#client.getGuildChannel(request, signal);
    }

    public async deleteGuild(request: ChannelCacheGuildRequestParams, signal?: AbortSignal): Promise<void> {
        return await this.#client.deleteGuild(request, signal);
    }

    public async handleChannelSet(handler: (channel: Discord.APIChannel, message: ConsumeMessage) => Awaitable<void>, channelId?: bigint | string): Promise<MessageHandle> {
        return await this.#messages.handleChannelSet(handler, channelId);
    }

    public async handleChannelDelete(handler: (channel: Discord.APIChannel, message: ConsumeMessage) => Awaitable<void>, channelId?: bigint | string): Promise<MessageHandle> {
        return await this.#messages.handleChannelDelete(handler, channelId);
    }
}

type DiscordChannelCacheClientOptions =
    & DiscordChannelCacheClientHttpOptions
    & DiscordChannelCacheClientBrokerOptions

type DiscordChannelCacheClientHttpOptions =
    | { readonly http: Parameters<typeof DiscordChannelCacheHttpClient['from']>[0]; }

type DiscordChannelCacheClientBrokerOptions =
    | { readonly hub: MessageHub; readonly serviceName: string; }
    | { readonly broker: DiscordChannelCacheMessageBroker; }
