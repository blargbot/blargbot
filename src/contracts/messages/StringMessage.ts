import z from 'zod';

import { asBuffer, asUint8Array } from '../util.js';
import { AmqpMessage } from './AmqpMessage.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const StringMessage = z.compile(z.codec(
    AmqpMessage,
    z.string(),
    {
        encode(value) {
            return {
                content: asUint8Array(Buffer.from(value)),
                properties: {
                    contentEncoding: 'utf-8' as const,
                    contentType: 'text/plain'
                }
            };
        },
        decode(value) {
            return asBuffer(value.content).toString(value.properties.contentEncoding);
        }
    }
));
export type StringMessage = z.infer<typeof StringMessage>;
