import { BBTagContext } from '../BBTagContext';
import { SubtagArgumentArray, SubtagCall, SubtagLogic } from '../types';
import { SubtagLogicWrapper } from './SubtagLogicWrapper';

export class StringifySubtagLogic<T extends { toString(): string; }> extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<T>>) {
        super();
    }

    protected async getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): Promise<[string]> {
        return [(await this.logic.execute(context, args, subtag)).toString()];
    }

}
