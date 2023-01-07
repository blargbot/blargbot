import type { BBTagScript, InterruptableAsyncProcess } from '@bbtag/engine';

import type { SubtagParameterDetails } from './SubtagParameter.js';
import { SubtagParameter } from './SubtagParameter.js';

export class RepeatedSubtagParameter<T, Items extends readonly unknown[]> extends SubtagParameter<T[], Items> {
    readonly #source: SubtagParameterDetails<T, Items>;

    public readonly minRepeat: number;
    public readonly maxRepeat: number;

    public get readers(): SubtagParameter<T[], Items>['readers'] {
        return this.#source.readers;
    }

    public constructor(source: SubtagParameterDetails<T, Items>, minItems: number, maxItems: number) {
        super();
        this.#source = source;
        this.minRepeat = minItems;
        this.maxRepeat = maxItems;

        if (source.minRepeat > 1)
            throw new Error('Min repeat of the source must be 0 or 1');
    }

    public async *aggregate(name: string, values: Array<[...Items]>, script: BBTagScript): InterruptableAsyncProcess<T[]> {
        const result = [];
        if (values.length === 0 && this.#source.minRepeat === 0)
            result.push(yield* this.#source.aggregate(name, [], script));
        else
            for (const group of values)
                result.push(yield* this.#source.aggregate(name, [group], script));
        return result;
    }
}
