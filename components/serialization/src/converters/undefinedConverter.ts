import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export const undefinedConverter = makeJsonConverter<undefined>({
    fromJson(value) {
        if (value === undefined)
            return success(undefined);
        return failed(`Value is not undefined ${String(value)}`);
    },
    test(value): value is undefined {
        return typeof value === 'undefined';
    },
    toJson(value) {
        return value;
    }
});
