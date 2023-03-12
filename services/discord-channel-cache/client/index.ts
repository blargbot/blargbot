import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, readResponse } from '@blargbot/api-client';
import type Discord from '@blargbot/discord-types';

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
