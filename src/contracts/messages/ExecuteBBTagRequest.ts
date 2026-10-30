import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ExecuteBBTagRequest = amqpJsonCodec(z.strictObject({
    authorizerId: z.bigint(),
    guildId: z.bigint(),
    channelId: z.bigint(),
    messageId: z.bigint(),
    userId: z.bigint(),
    authorId: z.bigint().optional(),
    prefix: z.string().optional(),
    cooldown: z.number(),
    tagVars: z.boolean(),
    tagName: z.string(),
    input: z.string(),
    flags: z.strictObject({
        flag: z.enum('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')),
        word: z.string()
    }).array(),
    mode: z.enum([
        'custom-command',
        'public-tag',
        'imported-tag',
        'general-auto-response',
        'everything-auto-response',
        'greeting',
        'interval',
        'roleme',
        'censor'
    ])
}));
export type ExecuteBBTagRequest = z.infer<typeof ExecuteBBTagRequest>;
