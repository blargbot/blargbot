import { SubtagArgumentArray } from '../arguments/index.js';
import { BBTagContext } from '../BBTagContext.js';
import { SubtagCall } from '../language/index.js';
import { SubtagLogic } from './SubtagLogic.js';
import { SubtagLogicWrapper } from './SubtagLogicWrapper.js';

export class StringIterableSubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<string> | Iterable<string>>>) {
        super();
    }

    protected async *getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): AsyncIterable<string> {
        for await (const item of this.toAsyncIterable(await this.logic.execute(context, args, subtag)))
            yield item;
    }
}
