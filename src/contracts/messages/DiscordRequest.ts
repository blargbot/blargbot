/* eslint-disable @typescript-eslint/naming-convention */
import z from 'zod';

import { asBuffer, asUint8Array, bufferToJson, jsonToBuffer, takeBytes } from '../util.js';
import AmqpMessage from './AmqpMessage.js';

const commonHeaders = z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    url: z.templateLiteral(['/', z.string()]),
    unauthorized: z.boolean().optional(),
    reason: z.string().optional(),
    runThroughQueue: z.boolean().optional(),
    headers: z.record(z.string(), z.string()).optional()
});

const output = z.intersection(
    commonHeaders,
    z.object({
        files: z.object({
            name: z.string(),
            blob: z.instanceof(Blob)
        }).array().optional(),
        body: z.unknown().optional()
    })
);

const metaSchema = z.intersection(
    commonHeaders,
    z.object({
        files: z.object({
            name: z.string(),
            type: z.string(),
            length: z.int()
        }).array().optional(),
        body: z.union([
            z.object({
                kind: z.literal('formData'),
                value: z.union([
                    z.object({
                        kind: z.literal('text'),
                        name: z.string(),
                        value: z.string()
                    }),
                    z.object({
                        kind: z.literal('file'),
                        name: z.string(),
                        fileName: z.string(),
                        type: z.string(),
                        length: z.int()
                    })
                ]).array()
            }),
            z.object({
                kind: z.literal('json'),
                value: z.unknown()
            })
        ]).optional()
    })
);

type DiscordRequest = z.infer<typeof DiscordRequest>;
const DiscordRequest = z.codec(
    AmqpMessage,
    output,
    {
        async encode(value) {
            const chunks = [];
            const meta: z.infer<typeof metaSchema> = {
                method: value.method,
                url: value.url,
                headers: value.headers,
                reason: value.reason,
                runThroughQueue: value.runThroughQueue,
                unauthorized: value.unauthorized
            };
            if (value.files !== undefined) {
                meta.files = [];
                for (const file of value.files) {
                    meta.files.push({
                        name: file.name,
                        type: file.blob.type,
                        length: file.blob.size
                    });
                    chunks.push(file.blob.bytes());
                }
            }
            if (value.body instanceof FormData) {
                meta.body = {
                    kind: 'formData',
                    value: []
                };
                for (const [name, entry] of value.body) {
                    if (typeof entry === 'string') {
                        meta.body.value.push({
                            kind: 'text',
                            name,
                            value: entry
                        });
                    } else {
                        meta.body.value.push({
                            kind: 'file',
                            name,
                            fileName: entry.name,
                            type: entry.type,
                            length: entry.size
                        });
                        chunks.push(entry.bytes());
                    }
                }
            } else if (value.body !== undefined) {
                meta.body = {
                    kind: 'json',
                    value: value.body
                };
            }
            const metaChunk = jsonToBuffer(meta);
            const metaLength = Buffer.alloc(4);
            metaLength.writeInt32BE(metaChunk.length);

            return {
                contentType: undefined,
                contentEncoding: 'utf-8' as const,
                content: asUint8Array(Buffer.concat([
                    asUint8Array(metaLength),
                    metaChunk,
                    ...await Promise.all(chunks)
                ]))
            };
        },
        decode(value) {
            let remain = value.content;
            function takeNextBytes(count: number): Uint8Array {
                const result = takeBytes(remain, count);
                remain = result[1];
                return result[0];
            }
            const metaLength = asBuffer(takeNextBytes(4)).readInt32BE();
            const meta = metaSchema.parse(bufferToJson(takeNextBytes(metaLength)));

            let files;
            if (meta.files !== undefined) {
                files = [];
                for (const file of meta.files) {
                    files.push({
                        name: file.name,
                        blob: new Blob([takeNextBytes(file.length)], { type: file.type })
                    });
                }
            }
            let body;
            switch (meta.body?.kind) {
                case 'formData': {
                    const formData = body = new FormData();
                    for (const entry of meta.body.value) {
                        switch (entry.kind) {
                            case 'text': {
                                formData.append(entry.name, entry.value);
                                break;
                            }
                            case 'file': {
                                formData.append(entry.name, new Blob([takeNextBytes(entry.length)], { type: entry.type }), entry.fileName);
                                break;
                            }
                        }
                    }
                    break;
                }
                case 'json': {
                    body = meta.body.value;
                    break;
                }
            }

            if (remain.byteLength !== 0)
                throw new Error(`Unexpected extra data. Expected ${value.content.byteLength - remain.byteLength} but got ${value.content.byteLength}`);

            return {
                method: meta.method,
                url: meta.url,
                headers: meta.headers,
                runThroughQueue: meta.runThroughQueue,
                reason: meta.reason,
                unauthorized: meta.unauthorized,
                files,
                body
            };
        }
    }
);

export default DiscordRequest;
