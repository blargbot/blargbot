import { parse as globalParse } from '@core';
import { flags } from './flags';
import { guildSetting } from './guildSetting';

export const parse = {
    ...globalParse,
    flags,
    guildSetting
};
