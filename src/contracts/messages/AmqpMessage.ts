import z from 'zod';

import { cleanType } from '../util.js';
import { BufferEncoding } from './BufferEncoding.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AmqpMessage = cleanType(z.object({
    content: z.instanceof(Uint8Array<ArrayBufferLike>),
    properties: z.object({
        contentType: z.string().optional().catch(undefined),
        contentEncoding: z.union([
            z.undefined(),
            BufferEncoding
        ]).optional().catch(undefined)
    })
}));
export type AmqpMessage = z.infer<typeof AmqpMessage>
