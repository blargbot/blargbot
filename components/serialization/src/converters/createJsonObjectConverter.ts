import type { IJsonConverter } from '../IJsonConverter.js';
import type { IJsonConverterImpl } from '../IJsonConverterImpl.js';
import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export type JsonObjectConverterOptions<T> = {
    [P in keyof T]-?:
    | P extends string | number ? IJsonConverterImpl<T[P]> : never
    | [dest: string, converter: IJsonConverterImpl<T[P]>]
}

export function createJsonObjectConverter<T extends object>(properties: JsonObjectConverterOptions<T>): IJsonConverter<T>;
export function createJsonObjectConverter(properties: JsonObjectConverterOptions<Record<PropertyKey, unknown>>): IJsonConverter<Record<PropertyKey, unknown>> {
    const proto = Object.getPrototypeOf(properties) as unknown;
    if (proto !== null && proto !== Object.prototype)
        throw new Error('Properties definition must directly extend Object or null');

    const props = [
        ...Object.getOwnPropertyNames(properties),
        ...Object.getOwnPropertySymbols(properties)
    ].map(dest => {
        const opt = properties[dest];
        const [src, convert] = Array.isArray(opt)
            ? opt
            : [dest, opt];
        if (typeof src === 'symbol')
            throw new Error('Cannot source values from a symbol!');

        return { dest, src, convert };
    });

    return makeJsonConverter({
        fromJson(value) {
            if (typeof value !== 'object' || value === null || Array.isArray(value))
                return failed(`Value is not an object ${String(value)}`);

            const result: Record<PropertyKey, unknown> = {};
            for (const prop of props) {
                const res = prop.convert.fromJson(value[prop.src]);
                if (!res.success)
                    return res;

                if (res.value !== undefined)
                    result[prop.dest] = res.value;
            }
            return success(result);
        },
        test(value): value is Record<PropertyKey, unknown> {
            if (typeof value !== 'object' || value === null || Array.isArray(value))
                return false;
            const v = value as Record<PropertyKey, unknown>;
            for (const prop of props) {
                if (!prop.convert.test(v[prop.dest]))
                    return false;
            }
            return true;
        },
        toJson(value) {
            const result: JObject = {};
            for (const prop of props) {
                const res = prop.convert.toJson(value[prop.dest]);
                if (res !== undefined)
                    result[prop.src] = res;
            }
            return result;
        }
    });
}
