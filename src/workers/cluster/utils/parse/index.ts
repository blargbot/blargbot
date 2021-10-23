import { parse as coreParse } from '@core/utils/parse';

import { flags } from './flags';
import { guildSetting } from './guildSetting';

export const parse = {
    ...coreParse,
    flags,
    guildSetting
};
