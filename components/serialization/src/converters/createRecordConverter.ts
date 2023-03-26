import type { IJsonConverter } from '../IJsonConverter.js';
import type { IJsonConverterImpl } from '../IJsonConverterImpl.js';
import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export type JsonObjectConverterOptions<T> = {
    [P in keyof T]-?:
    | P extends string | number ? IJsonConverterImpl<T[P]> : never
    | [dest: string, converter: IJsonConverterImpl<T[P]>]
}

export function createRecordConverter<T>(serializer: IJsonConverter<T>): IJsonConverter<Record<PropertyKey, T>> {
    return makeJsonConverter({
        fromJson(value) {
            if (typeof value !== 'object' || value === null || Array.isArray(value))
                return failed('Value is not a record type');
            const result: Record<PropertyKey, T> = {};
            for (const [k, v] of Object.entries(value)) {
                const res = serializer.fromJson(v);
                if (!res.success)
                    return res;
                result[k] = res.value;
            }
            return success(result);
        },
        test(value): value is Record<PropertyKey, T> {
            if (typeof value !== 'object' || value === null || Array.isArray(value))
                return false;
            return Object.values(value).every(v => serializer.test(v));
        },
        toJson(value) {
            return Object.fromEntries(
                Object.entries(value)
                    .map(([k, v]) => [k, serializer.toJson(v)])
            ) as JObject;
        }
    });
}
