import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';

export default {
    list: new EndpointBuilder<void, discord.RESTGetAPIGuildVoiceRegionsResult>()
        .setRoute('voice/regions')
        .setJsonResponse()
        .build()
};
