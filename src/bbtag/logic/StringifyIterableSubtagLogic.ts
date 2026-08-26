import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagContext } from '../BBTagContext.js';
import type { SubtagCall } from '../language/index.js';
import type { SubtagLogic } from './SubtagLogic.js';
import { SubtagLogicWrapper } from './SubtagLogicWrapper.js';

export class StringifyIterableSubtagLogic<T extends { toString(): string; }> extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<T> | Iterable<T>>>) {
        super();
    }

    protected async *getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): AsyncIterable<string> {
        for await (const item of this.toAsyncIterable(await this.logic.execute(context, args, subtag)))
            yield item.toString();
    }
}
