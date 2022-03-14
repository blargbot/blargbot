import { parse as coreParse } from '@blargbot/core/utils';

import { flags } from './flags';
import { guildSetting } from './guildSetting';

export const parse = Object.assign(Object.create(coreParse), {
    flags,
    guildSetting
});
