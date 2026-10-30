import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagContext } from '../BBTagContext.js';
import type { SubtagCall } from '../language/index.js';
import type { SubtagLogic } from './SubtagLogic.js';
import { SubtagLogicWrapper } from './SubtagLogicWrapper.js';

export class StringifySubtagLogic<T extends { toString(): string; }> extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<T>>) {
        super();
    }

    protected async getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): Promise<[string]> {
        return [(await this.logic.execute(context, args, subtag)).toString()];
    }

}
