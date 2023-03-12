import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagContext } from '../BBTagContext.js';
import type { SubtagCall } from '../language/index.js';
import type { SubtagLogic } from './SubtagLogic.js';
import { SubtagLogicWrapper } from './SubtagLogicWrapper.js';

export class DeferredSubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<string | undefined>>>) {
        super();
    }

    protected async * getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): AsyncIterable<string | undefined> {
        yield* await this.logic.execute(context, args, subtag);
    }
}
