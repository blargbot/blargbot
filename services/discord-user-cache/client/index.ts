import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, readResponse } from '@blargbot/api-client';
import type Discord from '@blargbot/discord-types';

export interface UserCacheCountResponse {
    readonly userCount: number;
}

export type UserCacheUserResponse = Discord.APIUser;

export class DiscordUserCacheHttpClient extends defineApiClient({
    getSelf: b => b.route('@self')
        .response<UserCacheUserResponse>(200)
        .response(404, () => undefined),
    getUser: b => b.route<string | bigint>(id => `${id}`)
        .response<UserCacheUserResponse>(200)
        .response(404, () => undefined),
    count: b => b.route('')
        .response(200, async b => (await readResponse<UserCacheCountResponse>(b)).userCount),
    clear: b => b.route('DELETE', '')
        .response(204)
}) {
    public static from(options: DiscordUserCacheHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): DiscordUserCacheHttpClient {
        if (options instanceof DiscordUserCacheHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new DiscordUserCacheHttpClient(options);
    }
}
