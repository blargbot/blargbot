import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const DiscordResponse = amqpJsonCodec(z.object({
    status: z.int(),
    statusText: z.string().optional(),
    body: z.unknown()
}));
export type DiscordResponse = z.infer<typeof DiscordResponse>;
