import { discord as coreDiscord } from '@core/utils/discord';

import * as cluster from './cluster';

export const discord = {
    ...coreDiscord,
    cluster
};
