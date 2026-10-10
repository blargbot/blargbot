import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SwitchShardsRequest = amqpJsonCodec(z.object({
    groupId: z.string()
}));
export type SwitchShardsRequest = z.infer<typeof SwitchShardsRequest>;
