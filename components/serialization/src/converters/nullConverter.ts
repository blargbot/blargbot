import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export const nullConverter = makeJsonConverter<null>({
    fromJson(value) {
        if (value !== null)
            return failed(`Value is not null ${String(value)}`);
        return success(null);
    },
    test(value): value is null {
        return value === null;
    },
    toJson() {
        return null;
    }
});
