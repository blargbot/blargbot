import type { SubtagLogic } from './SubtagLogic.js';

export function stringIterableSubtagLogic<Locals extends Record<string, unknown>>(
    next: SubtagLogic<Locals, Awaitable<AwaitableIterable<string>>>
): SubtagLogic<Locals> {
    return async function* stringIterableResults(ctx, args, bbtag) {
        for await (const item of await next(ctx, args, bbtag))
            yield item;
    };
}
