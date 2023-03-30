import { createJsonUnionConverter } from './converters/createJsonUnionConverter.js';
import { nullConverter } from './converters/nullConverter.js';
import { undefinedConverter } from './converters/undefinedConverter.js';
import type { IJsonConverter } from './IJsonConverter.js';
import type { IJsonConverterImpl } from './IJsonConverterImpl.js';

export function makeJsonConverter<T, Conv extends IJsonConverterImpl<T> = IJsonConverterImpl<T>>(converter: Conv): IJsonConverter<T> {
    async function read(value: string): Promise<T> {
        const v = JSON.parse(value);
        const result = await converter.fromJson(v);
        if (!result.success)
            throw new Error(`Reading failed: ${result.reason}`);
        return result.value;
    }
    async function write(value: T): Promise<string> {
        if (!converter.test(value))
            throw new Error('Writing failed: Value isnt compatible');
        const result = await converter.toJson(value);
        if (result === undefined)
            throw new Error('Writing failed: Cannot stringify undefined');
        return JSON.stringify(result);
    }
    return Object.create(converter, {
        read: { value: read },
        write: { value: write },
        fromBlob: {
            value: async function fromBlob(blob: Blob): Promise<T> {
                const mediaType = blob.type.split(';')[0];
                if (mediaType !== 'application/json')
                    throw new Error(`Cannot read content of type ${blob.type}`);
                return await read(await blob.text());
            }
        },
        toBlob: {
            value: async function toBlob(value: T): Promise<Blob> {
                return new Blob([await write(value)], { type: 'application/json' });
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
