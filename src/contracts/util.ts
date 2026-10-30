import type { ImplicitArrayBuffer } from 'node:buffer';

import z from 'zod';

import { AmqpMessage } from './messages/AmqpMessage.js';

export function cleanType<Schema extends z.ZodType>(schema: Schema): z.ZodType<Schema['_zod']['output'], Schema['_zod']['input']> {
    return schema;
}

export function takeBytes(source: Uint8Array, count: number): [taken: Uint8Array<ArrayBuffer>, remain: Uint8Array<ArrayBuffer>] {
    if (source.byteLength < count)
        throw new Error(`Buffer too small. Attempted to take ${count} bytes, but only ${source.byteLength} are available.`);

    return [source.slice(0, count), source.slice(count)];
}

export function asUint8Array<Array extends ArrayBufferLike>(buffer: Buffer<Array>): Uint8Array<ArrayBuffer> {
    if (buffer.buffer instanceof ArrayBuffer)
        return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return new Uint8Array(buffer);
}

export function jsonToBuffer(value: unknown, encoding?: BufferEncoding, replacer?: (key: string, value: unknown) => unknown): Uint8Array<ArrayBuffer> {
    return stringToBuffer(JSON.stringify(value, replacer), encoding);
}

export function bufferToJson(value: Uint8Array, encoding?: BufferEncoding, reviver?: (key: string, value: unknown) => unknown): JToken {
    return JSON.parse(bufferToString(value, encoding), reviver) as JToken;
}

export function stringToBuffer(value: string, encoding?: BufferEncoding): Uint8Array<ArrayBuffer> {
    return asUint8Array(Buffer.from(value, encoding));
}

export function bufferToString(value: Uint8Array, encoding?: BufferEncoding): string {
    return asBuffer(value).toString(encoding);
}

export function asBuffer<Array extends ArrayBufferLike>(chunk: Uint8Array<Array>): Buffer<ImplicitArrayBuffer<Array>> {
    return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
}

export function amqpJsonCodec<Type>(definition: z.ZodType<Type>): z.ZodType<Type, AmqpMessage> {
    return z.compile(z.codec(
        AmqpMessage,
        definition,
        {
            encode(value) {
                return {
                    content: jsonToBuffer(value, undefined, (_, value) => {
                        if (typeof value === 'bigint')
                            return bigintObj.encode(value);
                        return value;
                    }),
                    properties: {
                        contentType: 'application/json',
                        contentEncoding: 'utf-8' as const
                    }
                };
            },
            decode(value) {
                return definition.parse(bufferToJson(value.content, value.properties.contentEncoding, (_, value) => {
                    const parsed = bigintObj.safeParse(value);
                    return parsed.success ? parsed.data : value;
                }));
            }
        }
    ));
}

export function inferReturnType<Fn extends (this: never, ...args: never) => unknown>(impl: Fn): Fn {
    return impl;
}

const bigintObj = z.codec(
    z.strictObject({
        $type: z.literal('bigint'),
        $value: z.string().regex(/^[+-]?\d+$/)
    }),
    z.bigint(),
    {
        encode(value) {
            return { $type: 'bigint', $value: value.toString() } as const;
        },
        decode(value) {
            return BigInt(value.$value);
        }
    }
)