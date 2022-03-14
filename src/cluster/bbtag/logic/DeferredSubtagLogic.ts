import { SubtagArgumentArray, SubtagCall, SubtagLogic, SubtagResult } from '@cluster/types';

import { BBTagContext } from '../BBTagContext';
import { SubtagLogicWrapper } from './SubtagLogicWrapper';

export class DeferredSubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<SubtagResult>>) {
        super();
    }

    protected getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): Awaitable<SubtagResult> {
        return this.logic.execute(context, args, subtag);
    }
}
