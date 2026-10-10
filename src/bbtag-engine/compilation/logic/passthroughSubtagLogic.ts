import type { SubtagLogic } from './SubtagLogic.js';

export function passthroughSubtagLogic<Locals extends object>(
    next: SubtagLogic<Locals, Awaitable<AwaitableIterable<string>>>
): SubtagLogic<Locals> {
    return async function* passthroughResults(ctx, args, bbtag) {
        yield* await next(ctx, args, bbtag);
    };
}
