import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ResumeBBTagMessage = amqpJsonCodec(z.strictObject({
    guildId: z.string(),
    version: z.number(),
    data: z.unknown(),
}));
export type ResumeBBTagMessage = z.infer<typeof ResumeBBTagMessage>;
