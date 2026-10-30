import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SuspendBBTagMessage = amqpJsonCodec(z.strictObject({
    guildId: z.string(),
    version: z.number(),
    data: z.unknown(),
    timestamp: z.instanceof(Temporal.Instant)
}));
export type SuspendBBTagMessage = z.infer<typeof SuspendBBTagMessage>;
