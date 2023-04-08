import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient } from '@blargbot/api-client';
import { json } from '@blargbot/serialization';

export interface ChannelSearchOptions {
    readonly ownerId: bigint;
    readonly query: string;
}

export class ChannelSearchHttpClient extends defineApiClient({
    search: b => b.route<ChannelSearchOptions>(x => `${x.ownerId}`)
        .query(({ query }) => ({ query }))
        .response(200, searchSerializer.fromBlob)
}) {
    public static from(options: ChannelSearchHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): ChannelSearchHttpClient {
        if (options instanceof ChannelSearchHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new ChannelSearchHttpClient(options);
    }
}

const searchSerializer = json.array(json.bigint);
