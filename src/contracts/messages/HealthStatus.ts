import z from 'zod';

import { bufferToJson, cleanType, jsonToBuffer } from '../util.js';
import AmqpMessage from './AmqpMessage.js';

const output = z.object({
    id: z.string(),
    service: z.string(),
    alive: z.boolean(),
    timestamp: z.number(),
    memory: z.object({
        arrayBuffers: z.number(),
        external: z.number(),
        heapTotal: z.number(),
        heapUsed: z.number(),
        rss: z.number()
    }),
    data: z.unknown().optional()
});

type HealthStatus = z.infer<typeof HealthStatus>;
// eslint-disable-next-line @typescript-eslint/naming-convention
const HealthStatus = cleanType(z.codec(
    AmqpMessage,
    output,
    {
        encode(value) {
            return {
                content: jsonToBuffer(value),
                contentType: 'application/json',
                contentEncoding: 'utf-8' as const
            };
        },
        decode(value) {
            return output.parse(bufferToJson(value.content));
        }
    }
));

export { HealthStatus };
