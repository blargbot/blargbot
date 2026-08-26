import { parse as coreParse } from '@blargbot/core/utils/index.js';

import { guildSetting } from './guildSetting.js';

export const parse = Object.assign(Object.create(coreParse), {
    guildSetting
});
