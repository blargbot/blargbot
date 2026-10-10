import { parseFlags } from './flags.js';
import { parseBigInt } from './parseBigInt.js';
import { parseBoolean } from './parseBoolean.js';
import { parseColor } from './parseColor.js';
import { parseDuration } from './parseDuration.js';
import { parseEmbed } from './parseEmbed.js';
import { parseEntityId } from './parseEntityId.js';
import { parseFloat } from './parseFloat.js';
import { parseInt } from './parseInt.js';
import { parseString } from './parseString.js';
import { parseTime } from './parseTime.js';
import { parseUrl } from './parseUrl.js';

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
