import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export const regexConverter = makeJsonConverter<RegExp>({
    fromJson(value) {
        if (typeof value !== 'string')
            return failed(`Value is not a string ${String(value)}`);
        const match = value.match(/^\/(.*)\/([igmsuy]*)$/);
        if (match === null)
            return failed(`Value is an invalid regex ${String(value)}`);
        return success(new RegExp(match[1], match[2]));
    },
    test(value): value is RegExp {
        return value instanceof RegExp;
    },
    toJson(value) {
        return value.toString();
    }
});
