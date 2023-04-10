import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient } from '@blargbot/api-client';
import { json } from '@blargbot/serialization';

export interface ChannelSearchOptions {
    readonly ownerId: bigint;
    readonly query: string;
}

const searchSerializer = json.array(json.bigint);

export class DiscordChannelSearchHttpClient extends defineApiClient({
    search: b => b.route<ChannelSearchOptions>(x => `${x.ownerId}`)
        .query(({ query }) => ({ query }))
        .response(200, searchSerializer.fromBlob)
}) {
    public static from(options: DiscordChannelSearchHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): DiscordChannelSearchHttpClient {
        if (options instanceof DiscordChannelSearchHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new DiscordChannelSearchHttpClient(options);
    }
}
