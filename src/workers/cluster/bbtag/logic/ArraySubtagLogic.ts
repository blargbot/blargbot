import { SubtagArgumentArray, SubtagCall, SubtagLogic, SubtagResult } from '@cluster/types';

import { BBTagContext } from '../BBTagContext';
import { SubtagLogicWrapper } from './SubtagLogicWrapper';

export class ArraySubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<JToken> | Iterable<JToken> | undefined>>) {
        super();
    }

    protected async *getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): SubtagResult {
        const values = await this.logic.execute(context, args, subtag);
        if (values === undefined)
            return;

        if (Array.isArray(values))
            return yield JSON.stringify(values);

        const result = [];
        for await (const item of this.toAsyncIterable(values)) {
            yield undefined;
            result.push(item);
        }

        yield JSON.stringify(result);
    }
}
