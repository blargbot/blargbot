import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagCall } from '../BBTagCall.js';
import type { BBTagScript } from '../BBTagScript.js';
import type { SubtagLogic } from './SubtagLogic.js';
import { SubtagLogicWrapper } from './SubtagLogicWrapper.js';

export class ArrayOrValueSubtagLogicWrapper<T extends { toString(): string; }> extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<T | AsyncIterable<unknown> | Iterable<unknown> | undefined | void>>) {
        super();
    }

    protected async getResults(context: BBTagScript, args: SubtagArgumentArray, subtag: BBTagCall): Promise<string> {
        const values = await this.logic.execute(context, args, subtag) ?? '';
        if (Array.isArray(values))
            return JSON.stringify(values);

        if (typeof values !== 'object' || !isIterable(values))
            return values.toString();

        const result = [];
        for await (const item of this.iterate(context, subtag, values))
            result.push(item);

        return JSON.stringify(result);
    }
}

function isIterable<T>(value: object): value is AsyncIterable<T> | Iterable<T> {
    return typeof value !== 'string' && Symbol.iterator in value || Symbol.asyncIterator in value;
}
