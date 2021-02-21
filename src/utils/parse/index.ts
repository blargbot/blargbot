import { boolean } from './boolean';
import { color } from './color';
import { duration } from './duration';
import { embed } from './embed';
import { entityId } from './entityId';
import { flags } from './flags';
import { float } from './float';
import { int } from './int';
import { time } from './time';
import { emoji } from './emoji';
import { guildSetting } from './guildSetting';

export { FlagDefinition, FlagResult } from './flags';

export const parse = {
    boolean,
    color,
    duration,
    embed,
    entityId,
    flags,
    float,
    int,
    time,
    emoji,
    guildSetting
};