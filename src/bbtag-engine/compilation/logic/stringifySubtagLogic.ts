import type { SubtagLogic } from './SubtagLogic.js';

export function stringifySubtagLogic<Locals extends object, T>(
    next: SubtagLogic<Locals, Awaitable<T>>,
    conversion: (value: T) => string
): SubtagLogic<Locals>
export function stringifySubtagLogic<Locals extends object, T extends { toString(): string; }>(
    next: SubtagLogic<Locals, Awaitable<T>>,
    conversion?: (value: T) => string
): SubtagLogic<Locals>
export function stringifySubtagLogic<Locals extends object, T extends { toString(): string; }>(
    next: SubtagLogic<Locals, Awaitable<T>>,
    conversion?: (value: T) => string
): SubtagLogic<Locals> {
    conversion ??= v => v.toString();
    return async function* stringifyResults(ctx, args, bbtag) {
        const result = await next(ctx, args, bbtag);
        yield conversion(result);
    };
}
