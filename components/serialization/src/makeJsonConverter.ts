import { createJsonUnionConverter } from './converters/createJsonUnionConverter.js';
import { nullConverter } from './converters/nullConverter.js';
import { undefinedConverter } from './converters/undefinedConverter.js';
import type { IJsonConverter } from './IJsonConverter.js';
import type { IJsonConverterImpl } from './IJsonConverterImpl.js';

export function makeJsonConverter<T, Conv extends IJsonConverterImpl<T> = IJsonConverterImpl<T>>(converter: Conv): IJsonConverter<T> {
    return Object.create(converter, {
        read: {
            value: function read(value: string): T {
                const v = JSON.parse(value);
                const result = converter.fromJson(v);
                if (!result.success)
                    throw new Error(`Reading failed: ${result.reason}`);
                return result.value;
            }
        },
        write: {
            value: function write(value: T): string {
                if (!converter.test(value))
                    throw new Error('Writing failed: Value isnt compatible');
                const result = converter.toJson(value);
                if (result === undefined)
                    throw new Error('Writing failed: Cannot stringify undefined');
                return JSON.stringify(result);
            }
        },
        optional: {
            get: () => createJsonUnionConverter(converter, undefinedConverter)
        },
        nullable: {
            get: () => createJsonUnionConverter(converter, nullConverter)
        },
        nullish: {
            get: () => createJsonUnionConverter(converter, undefinedConverter, nullConverter)
        }
    });
}
