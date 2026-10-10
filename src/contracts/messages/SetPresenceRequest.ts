import { ActivityTypes, PresenceStatus } from '@discordeno/types';
import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SetPresenceRequest = amqpJsonCodec(z.object({
    afk: z.boolean(),
    since: z.number().nullable(),
    status: z.enum(Object.keys(PresenceStatus)).exclude(['offline']),
    activities: z.object({
        name: z.string(),
        type: z.enum(ActivityTypes),
        url: z.string().nullable().optional(),
        state: z.string().nullable().optional()
    }).array()
}));
export type SetPresenceRequest = z.infer<typeof SetPresenceRequest>;
