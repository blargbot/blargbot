import { BBTagContext } from '../BBTagContext';
import { SubtagArgumentArray, SubtagCall, SubtagLogic } from '../types';
import { SubtagLogicWrapper } from './SubtagLogicWrapper';

export class StringIterableSubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<string> | Iterable<string>>>) {
        super();
    }

    protected async *getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): AsyncIterable<string> {
        for await (const item of this.toAsyncIterable(await this.logic.execute(context, args, subtag)))
            yield item;
    }
}
