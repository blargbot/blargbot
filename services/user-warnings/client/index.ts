import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, jsonBody, readResponse } from '@blargbot/api-client';

export interface UserWarningsResponse {
    readonly count: number;
}

export interface UserWarningsUpdateRequestBody {
    readonly assign: number;
}

export interface GuildWarningsRequestParameters {
    readonly guildId: string | bigint;
}

export interface UserWarningsRequestParameters extends GuildWarningsRequestParameters {
    readonly userId: string | bigint;
}

export interface UserWarningsUpdateRequest extends UserWarningsUpdateRequestBody, UserWarningsRequestParameters {
}

export interface UserWarningsUpdateResponse {
    readonly oldCount: number;
    readonly newCount: number;
}

export class UserWarningsHttpClient extends defineApiClient({
    getWarnings: b => b.route<UserWarningsRequestParameters>(x => `${x.guildId}/${x.userId}`)
        .response<UserWarningsResponse>(200),
    assignWarnings: b => b.route<UserWarningsUpdateRequest>('PATCH', x => `${x.guildId}/${x.userId}`)
        .body(x => jsonBody({ assign: x.assign } satisfies UserWarningsUpdateRequestBody))
        .response(200, readResponse<UserWarningsUpdateResponse>),
    clearWarnings: b => b.route<UserWarningsUpdateRequest>('DELETE', x => `${x.guildId}/${x.userId}`)
        .response(204),
    clearAllWarnings: b => b.route<GuildWarningsRequestParameters>('DELETE', x => `${x.guildId}`)
        .response(204)
}) {
    public static from(options: UserWarningsHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): UserWarningsHttpClient {
        if (options instanceof UserWarningsHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new UserWarningsHttpClient(options);
    }
}
