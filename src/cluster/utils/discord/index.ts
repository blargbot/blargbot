import { discord as coreDiscord } from '@blargbot/core/utils/discord/index.js';

import * as cluster from './cluster.js';

export const discord = {
    ...coreDiscord,
    cluster
};
