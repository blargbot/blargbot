import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const KillWorkerRequest = amqpJsonCodec(z.object({
    workerId: z.string()
}));
export type KillWorkerRequest = z.infer<typeof KillWorkerRequest>;
