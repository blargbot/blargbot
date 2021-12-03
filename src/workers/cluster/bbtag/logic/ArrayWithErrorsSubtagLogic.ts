import { SubtagArgumentArray, SubtagCall, SubtagLogic } from '@cluster/types';

import { BBTagContext } from '../BBTagContext';
import { BBTagRuntimeError } from '../errors';
import { SubtagLogicWrapper } from './SubtagLogicWrapper';

export class ArrayWithErrorsSubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<JToken> | Iterable<JToken>>>) {
        super();
    }

    protected async *getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): AsyncIterable<string | undefined> {
        const values = await this.logic.execute(context, args, subtag);
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
