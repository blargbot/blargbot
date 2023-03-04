import { bigintConverter } from './converters/bigintConverter.js';
import { booleanConverter } from './converters/booleanConverter.js';
import { bufferConverter } from './converters/bufferConverter.js';
import { createJsonArrayConverter } from './converters/createJsonArrayConverter.js';
import { createJsonObjectConverter } from './converters/createJsonObjectConverter.js';
import { createJsonUnionConverter } from './converters/createJsonUnionConverter.js';
import { dateConverter } from './converters/dateConverter.js';
import { nullConverter } from './converters/nullConverter.js';
import { numberConverter } from './converters/numberConverter.js';
import { regexConverter } from './converters/regexConverter.js';
import { stringConverter } from './converters/stringConverter.js';
import { undefinedConverter } from './converters/undefinedConverter.js';
import { unknownConverter } from './converters/unknownConverter.js';

export * from './IJsonConverter.js';
export * from './IJsonConverterImpl.js';
export * from './IJsonConverterType.js';
export * from './ISerializer.js';
export * from './JsonConverterResult.js';
export * from './makeJsonConverter.js';
export * as Convert from './result.js';

export const json = {
    object: createJsonObjectConverter,
    choice: createJsonUnionConverter,
    array: createJsonArrayConverter,
    boolean: booleanConverter,
    number: numberConverter,
    bigint: bigintConverter,
    string: stringConverter,
    null: nullConverter,
    undefined: undefinedConverter,
    regex: regexConverter,
    date: dateConverter,
    buffer: bufferConverter,
    unknown: unknownConverter
} as const;
