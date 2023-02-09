import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export const stringConverter = makeJsonConverter<string>({
    fromJson(value) {
        if (typeof value !== 'string')
            return failed(`Value is not a string ${String(value)}`);
        return success(value);
    },
    test(value): value is string {
        return typeof value === 'string';
    },
    toJson(value) {
        return value;
    }
});
