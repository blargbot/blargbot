import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagCall } from '../BBTagCall.js';
import type { BBTagScript } from '../BBTagScript.js';
import type { SubtagLogic } from './SubtagLogic.js';
import { SubtagLogicWrapper } from './SubtagLogicWrapper.js';

export class StringIterableSubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<AsyncIterable<string> | Iterable<string>>>) {
        super();
    }

    protected async getResults(context: BBTagScript, args: SubtagArgumentArray, subtag: BBTagCall): Promise<string> {
        const results = [];
        for await (const item of this.iterate(context, subtag, await this.logic.execute(context, args, subtag)))
            results.push(item);
        return results.join('');
    }
}
