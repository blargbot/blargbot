import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const GatewayMessageRequest = amqpJsonCodec(z.object({
    shardId: z.number(),
    totalShards: z.number(),
    groupId: z.string(),
    op: z.string(),
    d: z.unknown()
}));
export type GatewayMessageRequest = z.infer<typeof GatewayMessageRequest>;
