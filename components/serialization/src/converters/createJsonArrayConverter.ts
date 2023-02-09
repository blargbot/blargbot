import type { IJsonConverter } from '../IJsonConverter.js';
import type { IJsonConverterImpl } from '../IJsonConverterImpl.js';
import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export function createJsonArrayConverter<Element>(element: IJsonConverterImpl<Element>): IJsonConverter<Element[]> {
    return makeJsonConverter<Element[]>({
        fromJson(value) {
            if (!Array.isArray(value))
                return failed(`Value is not an array ${String(value)}`);

            const result = [];
            for (const v of value) {
                const res = element.fromJson(v);
                if (!res.success)
                    return res;

                result.push(res.value);
            }
            return success(result);
        },
        test(value): value is Element[] {
            return Array.isArray(value) && value.every(e => element.test(e));
        },
        toJson(value) {
            return value.map(v => element.toJson(v) ?? null);
        }
    });
}
