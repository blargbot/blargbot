import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export const bufferConverter = makeJsonConverter<Buffer>({
    fromJson(value) {
        if (typeof value !== 'string' || !base64Regex.test(value))
            return failed('Value must be a base64 string');

        return success(Buffer.from(value, 'base64'));
    },
    test(value): value is Buffer {
        return value instanceof Buffer;
    },
    toJson(value) {
        return value.toString('base64');
    }
});

const base64Regex = /^[a-zA-Z0-9+/]+={0,3}$/;
