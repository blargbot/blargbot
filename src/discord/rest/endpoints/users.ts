import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';

export default {
    get: new EndpointBuilder<{ userId: string; }, discord.RESTGetAPIUserResult>()
        .setRoute(x => `users/${x.userId}`)
        .setJsonResponse()
        .build()
} as const;
