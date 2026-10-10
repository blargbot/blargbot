/* eslint-disable @typescript-eslint/naming-convention */
import z from 'zod';

import { asBuffer, asUint8Array, bufferToJson, cleanType, jsonToBuffer, takeBytes } from '../util.js';
import { AmqpMessage } from './AmqpMessage.js';

const output = z.object({
    fileName: z.string(),
    data: z.instanceof(Uint8Array<ArrayBufferLike>)
}).or(z.null());

const metaSchema = z.compile(z.object({
    fileName: z.string(),
    dataLength: z.number()
}));

export const ImageResponse = cleanType(z.compile(z.codec(
    AmqpMessage,
    output,
    {
        encode(value) {
            if (value === null) {
                return {
                    content: new Uint8Array(0),
                    properties: {}
                };
            }

            const meta: z.infer<typeof metaSchema> = {
                fileName: value.fileName,
                dataLength: value.data.byteLength
            };

            const metaChunk = jsonToBuffer(meta);
            const metaLength = Buffer.alloc(4);
            metaLength.writeInt32BE(metaChunk.length);

            return {
                content: asUint8Array(Buffer.concat([
                    asUint8Array(metaLength),
                    metaChunk,
                    value.data
                ])),
                properties: {
                    contentType: undefined,
                    contentEncoding: 'utf-8' as const
                }
            };
        },
        decode(value, ctx) {
            if (value.content.length === 0)
                return null;

            let remain = value.content;
            function takeNextBytes(count: number): typeof remain {
                const result = takeBytes(remain, count);
                remain = result[1];
                return result[0];
            }
            function notEnoughBytes(count: number): never {
                const taken = value.content.byteLength - remain.byteLength;
                ctx.issues.push({
                    code: 'too_small',
                    minimum: taken + count,
                    input: value.content.byteLength,
                    message: `Buffer too small. Attempted to take ${taken + count} bytes, but only ${value.content.byteLength} are available.`,
                    origin: 'file'
                });
                return z.NEVER;
            }

            if (remain.byteLength < 4)
                return notEnoughBytes(4);
            const metaLength = asBuffer(takeNextBytes(4)).readInt32BE();

            if (remain.byteLength < metaLength)
                return notEnoughBytes(metaLength);
            const metaResult = metaSchema.safeParse(bufferToJson(takeNextBytes(metaLength)));
            if (!metaResult.success) {
                ctx.issues.push(...metaResult.error.issues as never[]);
                return z.NEVER;
            }
            const meta = metaResult.data;
            if (remain.byteLength < meta.dataLength)
                return notEnoughBytes(meta.dataLength);
            const data = takeNextBytes(meta.dataLength);

            if (remain.byteLength !== 0) {
                const taken = value.content.byteLength - remain.byteLength;
                ctx.issues.push({
                    code: 'too_big',
                    maximum: taken,
                    input: value.content.byteLength,
                    message: `Unexpected extra data. Expected ${taken} bytes but got ${value.content.byteLength}`,
                    origin: 'file'
                });
                return z.NEVER;
            }

            return {
                fileName: meta.fileName,
                data
            };
        }
    }
)));
export type ImageResponse = z.infer<typeof ImageResponse>;
