import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const DiscordGatewayEvent = amqpJsonCodec(z.object({
    op: z.number(),
    d: z.unknown().nullable(),
    s: z.number().nullable(),
    t: z.string().nullable(),
    shardId: z.number(),
    totalShards: z.number()
}));
export type DiscordGatewayEvent = z.infer<typeof DiscordGatewayEvent>;
