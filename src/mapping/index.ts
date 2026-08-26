import { createMapping } from './createMapping.js';
import { mapArray } from './mapArray.js';
import { mapBase64 } from './mapBase64.js';
import { mapBigInt } from './mapBigInt.js';
import { mapBoolean } from './mapBoolean.js';
import { mapChoice } from './mapChoice.js';
import { mapDate } from './mapDate.js';
import { mapDuration } from './mapDuration.js';
import { mapFake } from './mapFake.js';
import { mapGuard } from './mapGuard.js';
import { mapIn } from './mapIn.js';
import { mapInstanceof } from './mapInstanceof.js';
import { mapJObject } from './mapJObject.js';
import { mapJson } from './mapJson.js';
import { mapJToken } from './mapJToken.js';
import { mapNumber } from './mapNumber.js';
import { mapObject } from './mapObject.js';
import { mapRecord } from './mapRecord.js';
import { mapRegex } from './mapRegex.js';
import { mapString } from './mapString.js';
import { mapTuple } from './mapTuple.js';
import { mapTypeof } from './mapTypeof.js';
import { mapUnknown } from './mapUnknown.js';
import { result } from './result.js';

export * from './types.js';

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
