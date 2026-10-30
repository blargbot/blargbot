import { safeJSON } from '@blargbot/util';
import z from 'zod';

function fail(ctx: z.RefinementCtx): never {
    ctx.addIssue('Failed to parse json');
    return z.NEVER;
}

export const zodStringToJson = z.string()
    .transform(v => safeJSON.parse(v))
    .transform((v, ctx) => v.success ? v.value as unknown : fail(ctx));
