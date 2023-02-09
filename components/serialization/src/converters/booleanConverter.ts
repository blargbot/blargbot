import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export const booleanConverter = makeJsonConverter<boolean>({
    fromJson(value) {
        if (typeof value !== 'boolean')
            return failed(`Value is not a boolean ${String(value)}`);
        return success(value);
    },
    test(value): value is boolean {
        return typeof value === 'boolean';
    },
    toJson(value) {
        return value;
    }
});
