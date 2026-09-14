import { discord as coreDiscord } from '@blargbot/core';

import * as cluster from './cluster.js';

export const discord = {
    ...coreDiscord,
    cluster
};
