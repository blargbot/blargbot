import type { SubtagLogic } from './SubtagLogic.js';

export function stringifyIterableSubtagLogic<Locals extends Record<string, unknown>, T>(
    next: SubtagLogic<Locals, Awaitable<AwaitableIterable<T>>>,
    conversion: (value: T) => string
): SubtagLogic<Locals>
export function stringifyIterableSubtagLogic<Locals extends Record<string, unknown>, T extends { toString(): string; }>(
    next: SubtagLogic<Locals, Awaitable<AwaitableIterable<T>>>,
    conversion?: (value: T) => string
): SubtagLogic<Locals>
export function stringifyIterableSubtagLogic<Locals extends Record<string, unknown>, T extends { toString(): string; }>(
    next: SubtagLogic<Locals, Awaitable<AwaitableIterable<T>>>,
    conversion?: (value: T) => string
): SubtagLogic<Locals> {
    conversion ??= v => v.toString();
    return async function* stringifyIterableResults(ctx, args, bbtag) {
        for await (const item of await next(ctx, args, bbtag))
            yield conversion(item);
    };
}
