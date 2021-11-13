import { SubtagArgumentArray, SubtagCall, SubtagLogic } from '@cluster/types';

import { BBTagContext } from '../BBTagContext';
import { SubtagLogicWrapper } from './SubtagLogicWrapper';

export class ArrayWithErrorsSubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<JToken> | Iterable<JToken>>>) {
        super();
    }

    protected async *getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): AsyncIterable<string> {
        const values = await this.logic.execute(context, args, subtag);
        if (Array.isArray(values))
            return yield JSON.stringify(values);

        yield '[';
        for await (const item of this.toAsyncIterable(values))
            yield JSON.stringify(item);
        yield ']';
    }

    protected formatError(display: string): Iterable<string> {
        return [JSON.stringify(display), ']'];
    }
}
