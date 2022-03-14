import { SubtagArgumentArray, SubtagCall, SubtagLogic } from '@blargbot/cluster/types';

import { BBTagContext } from '../BBTagContext';
import { SubtagLogicWrapper } from './SubtagLogicWrapper';

export class IgnoreSubtagLogic<T> extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<T>>) {
        super();
    }

    protected async getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): Promise<[]> {
        await this.logic.execute(context, args, subtag);
        return [];
    }
}
