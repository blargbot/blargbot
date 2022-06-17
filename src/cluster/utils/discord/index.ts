import { discord as coreDiscord } from '@blargbot/core/utils/discord';

import * as cluster from './cluster';

export const discord = {
    ...coreDiscord,
    cluster
};
