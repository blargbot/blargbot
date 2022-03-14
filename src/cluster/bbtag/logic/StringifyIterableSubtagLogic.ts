import { SubtagArgumentArray, SubtagCall, SubtagLogic } from '@cluster/types';

import { BBTagContext } from '../BBTagContext';
import { SubtagLogicWrapper } from './SubtagLogicWrapper';

export class StringifyIterableSubtagLogic<T extends { toString(): string; }> extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<T> | Iterable<T>>>) {
        super();
    }

    protected async *getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): AsyncIterable<string> {
        for await (const item of this.toAsyncIterable(await this.logic.execute(context, args, subtag)))
            yield item.toString();
    }
}
