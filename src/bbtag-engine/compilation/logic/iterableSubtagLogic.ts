import { BBTagRuntimeError } from '../../BBTagRuntimeError.js';
import { bigintReplacer } from './bigintReplacer.js';
import type { SubtagLogic } from './SubtagLogic.js';

export function iterableSubtagLogic<Locals extends object>(
    next: SubtagLogic<Locals, Awaitable<AwaitableIterable<JToken | bigint | undefined> | undefined>>
): SubtagLogic<Locals> {
    return async function* iterableResults(context, args, bbtag) {
        const values = await next(context, args, bbtag);
        if (values === undefined)
            return;

        if (Array.isArray(values))
            return yield JSON.stringify(values, bigintReplacer);

        const result = [];
        try {
            for await (const item of values)
                result.push(item);
        } catch (err: unknown) {
            if (!(err instanceof BBTagRuntimeError))
                throw err;
            result.push(await context.addError(err, bbtag));
        }

        yield JSON.stringify(result, bigintReplacer);
    };
}
