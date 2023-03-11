import { defineApiClient, readResponse } from '@blargbot/api-client';

import type { UserCacheCountResponse, UserCacheUserResponse } from './types.js';

export class DiscordUserCacheHttpClient extends defineApiClient(b => b
    .endpoint('getSelf', b => b
        .route('@self')
        .response<UserCacheUserResponse>(200)
        .response(404, () => undefined))
    .endpoint('getUser', b => b
        .arg<string | bigint>()
        .route(id => `${id}`)
        .response<UserCacheUserResponse>(200)
        .response(404, () => undefined))
    .endpoint('count', b => b
        .route('')
        .response(200, async b => (await readResponse<UserCacheCountResponse>(b)).userCount))
    .endpoint('clear', b => b
        .route('DELETE', '')
        .response(204))) {
}
