import type { IJsonConverter } from '../IJsonConverter.js';
import type { IJsonConverterImpl } from '../IJsonConverterImpl.js';
import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export function createJsonArrayConverter<Element>(element: IJsonConverterImpl<Element>): IJsonConverter<Element[]> {
    return makeJsonConverter<Element[]>({
        async fromJson(value) {
            if (!Array.isArray(value))
                return failed(`Value is not an array ${String(value)}`);

            const results = await Promise.all(value.map(v => element.fromJson(v)));
            const result = [];
            for (const res of results) {
                if (!res.success)
                    return res;
                result.push(res.value);
            }
            return success(result);
        },
        test(value): value is Element[] {
            return Array.isArray(value) && value.every(e => element.test(e));
        },
        async toJson(value) {
            return await Promise.all(value.map(async v => await element.toJson(v) ?? null));
        }
    });
}
