import z from 'zod';

import { amqpJsonCodec } from '../util.js';

const location = z.strictObject({
    index: z.number(),
    line: z.number(),
    column: z.number(),
})

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ExecuteBBTagResponse = amqpJsonCodec(z.strictObject({
    durationMs: z.number(),
    database: z.strictObject({
        durationMs: z.number(),
        saved: z.number(),
        values: z.record(z.string(), z.json())
    }),
    imported: z.string().array(),
    debug: z.strictObject({
        message: z.string(),
        start: location,
        end: location
    }).array(),
    errors: z.strictObject({
        message: z.string(),
        details: z.string().optional(),
        start: location,
        end: location
    }),
    subtags: z.record(
        z.string(),
        z.strictObject({
            count: z.number(),
            totalMs: z.number(),
            averageMs: z.number()
        })
    )
}));
export type ExecuteBBTagResponse = z.infer<typeof ExecuteBBTagResponse>;
