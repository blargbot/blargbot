import { parseFlags } from './flags';
import { parseBigInt } from './parseBigInt';
import { parseBoolean } from './parseBoolean';
import { parseColor } from './parseColor';
import { parseDuration } from './parseDuration';
import { parseEmbed } from './parseEmbed';
import { parseEntityId } from './parseEntityId';
import { parseFloat } from './parseFloat';
import { parseInt } from './parseInt';
import { parseString } from './parseString';
import { parseTime } from './parseTime';
import { parseUrl } from './parseUrl';

export const parse = {
    flags: parseFlags,
    color: parseColor,
    duration: parseDuration,
    embed: parseEmbed,
    entityId: parseEntityId,
    float: parseFloat,
    int: parseInt,
    bigInt: parseBigInt,
    boolean: parseBoolean,
    string: parseString,
    time: parseTime,
    url: parseUrl
};
