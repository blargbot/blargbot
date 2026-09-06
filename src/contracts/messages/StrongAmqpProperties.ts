import type { MessageProperties } from 'amqplib';
import z from 'zod';

import { BufferEncoding } from './BufferEncoding.js';

const output = z.object({
    contentType: z.string().optional().catch(undefined),
    contentEncoding: BufferEncoding.optional().catch(undefined),
    replyTo: z.string().optional().catch(undefined),
    correlationId: z.string().optional().catch(undefined),
    headers: z.record(z.string(), z.unknown()).optional().catch(undefined),
    deliveryMode: z.literal([1, 2]).optional().catch(undefined),
    priority: z.unknown().optional(),
    expiration: z.date().optional().catch(undefined),
    messageId: z.string().optional().catch(undefined),
    timestamp: z.date().optional().catch(undefined),
    type: z.string().optional().catch(undefined),
    userId: z.string().optional().catch(undefined),
    appId: z.string().optional().catch(undefined),
    clusterId: z.string().optional().catch(undefined)
} satisfies { [P in keyof MessageProperties]: unknown });
const input = z.object<MessageProperties>({
    contentType: z.any(),
    contentEncoding: z.any(),
    headers: z.any(),
    deliveryMode: z.any(),
    priority: z.any(),
    correlationId: z.any(),
    replyTo: z.any(),
    expiration: z.any(),
    messageId: z.any(),
    timestamp: z.any(),
    type: z.any(),
    userId: z.any(),
    appId: z.any(),
    clusterId: z.any()
});

type AmqpMessageProperties = z.infer<typeof AmqpMessageProperties>;
// eslint-disable-next-line @typescript-eslint/naming-convention
const AmqpMessageProperties = z.codec(
    input,
    output,
    {
        encode(value) {
            return input.parse(value);
        },
        decode(value) {
            return output.parse(value);
        }
    }
);

export { AmqpMessageProperties };
