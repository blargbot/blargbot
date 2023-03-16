import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagCall } from '../BBTagCall.js';
import type { BBTagScript } from '../BBTagScript.js';
import type { SubtagLogic } from './SubtagLogic.js';
import { SubtagLogicWrapper } from './SubtagLogicWrapper.js';

export class ArraySubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<unknown> | Iterable<unknown> | undefined>>) {
        super();
    }

    protected async getResults(context: BBTagScript, args: SubtagArgumentArray, subtag: BBTagCall): Promise<string> {
        const values = await this.logic.execute(context, args, subtag);
        if (values === undefined)
            return '';

        if (Array.isArray(values))
            return JSON.stringify(values);

        const result = [];
        for await (const item of this.iterate(context, subtag, values))
            result.push(item);

        return JSON.stringify(result);
    }
}
