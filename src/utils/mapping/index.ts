export * from './types';
import { mappingResultNever, mappingResultUndefined, mappingResultNull } from './constants';
import { mapAny } from './mapAny';
import { mapArray } from './mapArray';
import { mapBoolean } from './mapBoolean';
import { mapJson } from './mapJson';
import { mapBase64 } from './mapBase64';
import { mapObject } from './mapObject';
import { mapOptionalBoolean } from './mapOptionalBoolean';
import { mapOptionalNumber } from './mapOptionalNumber';
import { mapNumber } from './mapNumber';
import { mapOptionalString } from './mapOptionalString';
import { mapRecord } from './mapRecord';
import { mapString } from './mapString';

export const mapping = {
    result: {
        invalid: mappingResultNever,
        undefined: mappingResultUndefined,
        null: mappingResultNull
    },
    any: mapAny,
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
    base64: mapBase64
};