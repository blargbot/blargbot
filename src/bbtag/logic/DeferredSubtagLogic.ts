import { SubtagArgumentArray } from '../arguments';
import { BBTagContext } from '../BBTagContext';
import { SubtagCall } from '../language';
import { SubtagLogic } from './SubtagLogic';
import { SubtagLogicWrapper } from './SubtagLogicWrapper';

export class DeferredSubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<string | undefined>>>) {
        super();
    }

    protected async * getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): AsyncIterable<string | undefined> {
        yield* await this.logic.execute(context, args, subtag);
    }
}
