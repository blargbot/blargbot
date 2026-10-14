import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ShardInfoResponse = amqpJsonCodec(z.strictObject({
    ping: z.number(),
    guildCount: z.number()
}));
export type ShardInfoResponse = z.infer<typeof ShardInfoResponse>;
