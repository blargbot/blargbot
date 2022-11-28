import { createMapping } from './createMapping';
import { mapArray } from './mapArray';
import { mapBase64 } from './mapBase64';
import { mapBigInt } from './mapBigInt';
import { mapBoolean } from './mapBoolean';
import { mapChoice } from './mapChoice';
import { mapDate } from './mapDate';
import { mapDuration } from './mapDuration';
import { mapFake } from './mapFake';
import { mapGuard } from './mapGuard';
import { mapIn } from './mapIn';
import { mapInstanceof } from './mapInstanceof';
import { mapJObject } from './mapJObject';
import { mapJson } from './mapJson';
import { mapJToken } from './mapJToken';
import { mapNumber } from './mapNumber';
import { mapObject } from './mapObject';
import { mapRecord } from './mapRecord';
import { mapRegex } from './mapRegex';
import { mapString } from './mapString';
import { mapTuple } from './mapTuple';
import { mapTypeof } from './mapTypeof';
import { mapUnknown } from './mapUnknown';
import { result } from './result';

export * from './types';

export const mapping = Object.seal({
    create: createMapping,
    array: mapArray,
    tuple: mapTuple,
    base64: mapBase64,
    bigInt: mapBigInt,
    boolean: mapBoolean,
    choice: mapChoice,
    date: mapDate,
    duration: mapDuration,
    fake: mapFake,
    guard: mapGuard,
    in: mapIn,
    instanceof: mapInstanceof,
    typeof: mapTypeof,
    jObject: mapJObject,
    json: mapJson,
    jToken: mapJToken,
    number: mapNumber,
    object: mapObject,
    record: mapRecord,
    regex: mapRegex,
    string: mapString,
    unknown: mapUnknown,
    never: createMapping<never>(() => result.failed),
    ...result
});
