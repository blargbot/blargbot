import { makeJsonConverter } from '../makeJsonConverter.js';
import { success } from '../result.js';

export const unknownConverter = makeJsonConverter<unknown>({
    fromJson(value) {
        return success(value);
    },
    test(value): value is unknown {
        value;
        return true;
    },
    toJson(value) {
        switch (typeof value) {
            case 'bigint': return undefined;
            case 'symbol': return undefined;
            case 'function': return undefined;
            case 'undefined': return undefined;
            case 'boolean': return value;
            case 'string': return value;
            case 'number': return value;
            case 'object': return JSON.parse(JSON.stringify(value));
        }
    }
});
