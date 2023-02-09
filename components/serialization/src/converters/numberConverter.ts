import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export const numberConverter = makeJsonConverter<number>({
    fromJson(value) {
        if (typeof value !== 'number')
            return failed(`Value is not a number ${String(value)}`);
        return success(value);
    },
    test(value): value is number {
        return typeof value === 'number';
    },
    toJson(value) {
        return value;
    }
});
