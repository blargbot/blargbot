/* eslint-disable @typescript-eslint/naming-convention */
import z from 'zod';

import { cleanType } from '../util.js';
import { BufferEncoding } from './BufferEncoding.js';

type AmqpMessage = z.infer<typeof AmqpMessage>
const AmqpMessage = cleanType(z.object({
    content: z.instanceof(Uint8Array<ArrayBufferLike>),
    contentType: z.union([z.string(), z.undefined()]),
    contentEncoding: z.union([
        z.undefined(),
        BufferEncoding
    ])
}));
export default AmqpMessage;
