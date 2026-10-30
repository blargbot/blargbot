import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const PermitShardIdentifyRequest = amqpJsonCodec(z.strictObject({
    shardId: z.number(),
    totalShards: z.number()
}));
export type PermitShardIdentifyRequest = z.infer<typeof PermitShardIdentifyRequest>;
