import { parse as globalParse } from '../../globalCore';
import { flags } from './flags';
import { guildSetting } from './guildSetting';

export const parse = {
    ...globalParse,
    flags,
    guildSetting
};
