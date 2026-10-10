import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const DiscordGatewayRequest = amqpJsonCodec(z.object({
    op: z.number(),
    d: z.unknown().nullable(),
    shardId: z.number(),
    totalShards: z.number()
}));
export type DiscordGatewayRequest = z.infer<typeof DiscordGatewayRequest>;
