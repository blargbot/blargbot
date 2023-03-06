import { parseBigInt } from './parseBigInt.js';
import { parseBoolean } from './parseBoolean.js';
import { parseColor } from './parseColor.js';
import { parseDuration } from './parseDuration.js';
import { parseFloat } from './parseFloat.js';
import { parseInt } from './parseInt.js';
import { parseTime } from './parseTime.js';
import { parseUrl } from './parseUrl.js';

export const parse = {
    color: parseColor,
    duration: parseDuration,
    float: parseFloat,
    int: parseInt,
    bigInt: parseBigInt,
    boolean: parseBoolean,
    time: parseTime,
    url: parseUrl
};
