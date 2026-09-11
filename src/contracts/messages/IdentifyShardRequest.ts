import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const IdentifyShardRequest = amqpJsonCodec(z.object({
    shardId: z.number(),
    totalShards: z.number(),
    groupId: z.string(),
    intents: z.number(),
    token: z.string(),
    url: z.url(),
    version: z.number()
}));
export type IdentifyShardRequest = z.infer<typeof IdentifyShardRequest>;
