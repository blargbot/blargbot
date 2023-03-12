import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, readResponse } from '@blargbot/api-client';

import type { SlimDiscordGuild } from './SlimDiscordGuild.js';

export * from './SlimDiscordGuild.js';

export type GuildCacheGuildResponse = SlimDiscordGuild;
export interface GuildCacheGuildRequestParams {
    readonly guildId: string | bigint;
}
export interface GuildCacheGuildCountResponse {
    readonly guildCount: number;
}

export class DiscordGuildCacheHttpClient extends defineApiClient({
    getGuild: b => b.route<GuildCacheGuildRequestParams>(x => `${x.guildId}`)
        .response<GuildCacheGuildResponse>(200)
        .response(404, () => undefined),
    getCount: b => b.route('')
        .response(200, async b => (await readResponse<GuildCacheGuildCountResponse>(b)).guildCount),
    clear: b => b.route('DELETE', '')
        .response(204)
}) {
    public static from(options: DiscordGuildCacheHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): DiscordGuildCacheHttpClient {
        if (options instanceof DiscordGuildCacheHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new DiscordGuildCacheHttpClient(options);
    }
}
