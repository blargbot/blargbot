import z from 'zod';

import { AmqpMessage } from './AmqpMessage.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const EmptyMessage = z.compile(z.codec(
    AmqpMessage,
    z.undefined(),
    {
        encode() {
            return {
                content: new Uint8Array(0),
                properties: {
                    contentEncoding: undefined,
                    contentType: undefined
                }
            };
        },
        decode() {
            return undefined;
        }
    }
));
export type EmptyMessage = z.infer<typeof EmptyMessage>;
