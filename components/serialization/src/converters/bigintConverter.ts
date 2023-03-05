import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export const bigintConverter = makeJsonConverter<bigint>({
    fromJson(value) {
        if (typeof value !== 'string' || !/^[+-]?\d+$/.test(value))
            return failed(`Value is not a bigint ${String(value)}`);
        return success(BigInt(value));
    },
    test(value): value is bigint {
        return typeof value === 'bigint';
    },
    toJson(value) {
        return `${value}`;
    }
});
