import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const IdentifyShardResponse = amqpJsonCodec(z.object({
    error: z.string().optional()
}));
export type IdentifyShardResponse = z.infer<typeof IdentifyShardResponse>;
