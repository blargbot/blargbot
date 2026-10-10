import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ShardInfoRequest = amqpJsonCodec(z.object({
    shardId: z.number(),
    totalShards: z.number()
}));
export type ShardInfoRequest = z.infer<typeof ShardInfoRequest>;
