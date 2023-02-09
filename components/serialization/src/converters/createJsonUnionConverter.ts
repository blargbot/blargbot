import type { IJsonConverter } from '../IJsonConverter.js';
import type { IJsonConverterImpl } from '../IJsonConverterImpl.js';
import type { IJsonConverterType } from '../IJsonConverterType.js';
import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed } from '../result.js';

const children: unique symbol = Symbol('children');

export function createJsonUnionConverter<T extends Array<IJsonConverterImpl<unknown>>>(...converters: T): IJsonConverter<IJsonConverterType<T[number]>>;
export function createJsonUnionConverter(...converters: Array<IJsonConverterImpl<unknown>>): IJsonConverter<unknown> {
    const c = new Set<IJsonConverterImpl<unknown>>();
    for (const converter of converters) {
        if (isUnionConverter(converter)) {
            for (const child of converter[children]) {
                c.add(child);
            }
        } else {
            c.add(converter);
        }
    }
    if (c.size === 0)
        throw new Error('No converters have been supplied');

    converters = [...c];

    return makeJsonConverter<unknown, IUnionJsonConverter<unknown>>({
        [children]: Object.freeze(converters),
        fromJson(value) {
            const reasons = [];
            for (const converter of converters) {
                const result = converter.fromJson(value);
                if (result.success === true)
                    return result;
                reasons.push(result.reason);
            }
            return failed(reasons.join('\n'));
        },
        test(value): value is unknown {
            return converters.some(c => c.test(value));
        },
        toJson(value) {
            const converter = converters.find(c => c.test(value));
            if (converter === undefined)
                throw new Error(`Cannot find a converter to handle value ${String(value)}`);

            return converter.toJson(value);
        }
    });
}

interface IUnionJsonConverter<T> extends IJsonConverterImpl<T> {
    [children]: ReadonlyArray<IJsonConverterImpl<T>>;
}

function isUnionConverter<T>(converter: IJsonConverterImpl<T>): converter is IUnionJsonConverter<T> {
    return children in converter;
}
