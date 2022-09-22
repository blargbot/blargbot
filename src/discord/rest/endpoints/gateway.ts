import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';

export default {
    get: new EndpointBuilder<void, discord.RESTGetAPIGatewayResult>()
        .setRoute('gateway')
        .setJsonResponse()
        .build(),
    getBot: new EndpointBuilder<void, discord.RESTGetAPIGatewayBotResult>()
        .setRoute('gateway/bot')
        .setJsonResponse()
        .build()
};
