import { SubtagArgumentArray } from '../arguments/index.js';
import { BBTagContext } from '../BBTagContext.js';
import { BBTagRuntimeError } from '../errors/index.js';
import { SubtagCall } from '../language/index.js';
import { SubtagLogic } from './SubtagLogic.js';
import { SubtagLogicWrapper } from './SubtagLogicWrapper.js';

export class ArraySubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<unknown> | Iterable<unknown> | undefined>>) {
        super();
    }

    protected async *getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): AsyncIterable<string | undefined> {
        const values = await this.logic.execute(context, args, subtag);
        if (values === undefined)
            return;

        if (Array.isArray(values))
            return yield JSON.stringify(values);

        const result = [];
        try {
            for await (const item of this.toAsyncIterable(values)) {
                yield undefined;
                result.push(item);
            }
        } catch (err: unknown) {
            if (!(err instanceof BBTagRuntimeError))
                throw err;
            result.push(context.addError(err, subtag));
        }

        yield JSON.stringify(result);
    }
}
