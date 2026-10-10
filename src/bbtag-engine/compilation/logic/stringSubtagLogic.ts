import type { SubtagLogic } from './SubtagLogic.js';

export function stringSubtagLogic<Locals extends object>(
    next: SubtagLogic<Locals, Awaitable<string | undefined>>
): SubtagLogic<Locals> {
    return async function* stringResults(ctx, args, bbtag) {
        const result = await next(ctx, args, bbtag);
        if (result !== undefined)
            yield result;
    };
}
