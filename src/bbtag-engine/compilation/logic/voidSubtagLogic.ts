import type { SubtagLogic } from './SubtagLogic.js';

export function voidSubtagLogic<Locals extends object, T>(
    next: SubtagLogic<Locals, Awaitable<T>>
): SubtagLogic<Locals> {
    return async function* voidSubtagResults(ctx, args, bbtag) {
        await next(ctx, args, bbtag);
        yield* [];
    };
}
