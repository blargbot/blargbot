import type { SubtagLogic } from './SubtagLogic.js';

export function iterableOrSingleSubtagLogic<Locals extends object, T extends { toString(): string; }>(
    next: SubtagLogic<Locals, Awaitable<T | AwaitableIterable<unknown> | undefined | void>>
): SubtagLogic<Locals> {
    return async function* iterableOrSingleResult(context, args, bbtag) {
        const values = await next(context, args, bbtag);
        if (values === undefined)
            return;

        if (Array.isArray(values))
            return yield JSON.stringify(values);

        if (typeof values !== 'object' || !(Symbol.iterator in values) && !(Symbol.asyncIterator in values))
            return yield values.toString();

        const result = [];
        for await (const item of values)
            result.push(item);

        yield JSON.stringify(result);
    };
}
