import type { IJsonConverter } from '../IJsonConverter.js';
import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export function createLiteralConverter<T extends JValue>(value: T): IJsonConverter<T> {
    return makeJsonConverter({
        test(v): v is T {
            return v === value;
        },
        fromJson(v) {
            if (v === value)
                return success(value);
            return failed(`Value is not ${value}`);
        },
        toJson(value) {
            return value;
        }
    });
}
