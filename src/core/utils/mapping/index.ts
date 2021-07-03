export * from './types';
import { mappingResultNever, mappingResultNull, mappingResultUndefined } from './constants';
import { mapArray } from './mapArray';
import { mapBase64 } from './mapBase64';
import { mapBoolean } from './mapBoolean';
import { mapChoice } from './mapChoice';
import { mapIn } from './mapIn';
import { mapInstanceof } from './mapInstanceof';
import { mapJObject } from './mapJObject';
import { mapJson } from './mapJson';
import { mapJToken } from './mapJToken';
import { mapNumber } from './mapNumber';
import { mapObject } from './mapObject';
import { mapOptionalBoolean } from './mapOptionalBoolean';
import { mapOptionalNumber } from './mapOptionalNumber';
import { mapOptionalString } from './mapOptionalString';
import { mapRecord } from './mapRecord';
import { mapString } from './mapString';
import { mapUnknown } from './mapUnknown';

export const mapping = {
    result: {
        invalid: mappingResultNever,
        undefined: mappingResultUndefined,
        null: mappingResultNull
    },
    choose: mapChoice,
    array: mapArray,
    json: mapJson,
    object: mapObject,
    record: mapRecord,
    boolean: mapBoolean,
    optionalBoolean: mapOptionalBoolean,
    number: mapNumber,
    optionalNumber: mapOptionalNumber,
    string: mapString,
    optionalString: mapOptionalString,
    base64: mapBase64,
    in: mapIn,
    unknown: mapUnknown,
    jToken: mapJToken,
    jObject: mapJObject,
    instanceof: mapInstanceof
};
