import { parse as coreParse } from '@blargbot/core/utils';

import { guildSetting } from './guildSetting';

export const parse = Object.assign(Object.create(coreParse), {
    guildSetting
});
