import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const PermitShardIdentifyResponse = amqpJsonCodec(z.object({
    error: z.string().optional()
}));
export type PermitShardIdentifyResponse = z.infer<typeof PermitShardIdentifyResponse>;
