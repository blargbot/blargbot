import type { SubtagLogic } from './SubtagLogic.js';

export function stringSubtagLogic<Locals extends Record<string, unknown>>(
    next: SubtagLogic<Locals, Awaitable<string>>
): SubtagLogic<Locals> {
    return async function* stringResults(ctx, args, bbtag) {
        const result = await next(ctx, args, bbtag);
        yield result.toString();
    };
}
