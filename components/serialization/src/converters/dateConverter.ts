import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export const dateConverter = makeJsonConverter<Date>({
    fromJson(value) {
        switch (typeof value) {
            case 'number': return success(new Date(value));
            case 'string': {
                const date = new Date(value);
                if (isNaN(date.valueOf()))
                    break;
                return success(date);
            }
        }
        throw failed(`Value is an invalid date ${String(value)}`);
    },
    test(value): value is Date {
        return value instanceof Date;
    },
    toJson(value) {
        return value.valueOf();
    }
});
