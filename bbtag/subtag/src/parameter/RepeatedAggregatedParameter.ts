import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import { RepeatedFlatParameter } from './RepeatedFlatParameter.js';
import type { SubtagParameter } from './SubtagParameter.js';

export class RepeatedAggregatedParameter<T, Items extends readonly unknown[]> implements SubtagParameter<T[], Items> {
    readonly #aggregate: (values: Items, script: BBTagScript) => InterruptableProcess<T>;

    public readonly minRepeat: number;
    public readonly maxRepeat: number;
    public readonly values: SubtagParameter<T[], Items>['values'];

    public constructor(values: SubtagParameter<T[], Items>['values'], aggregate: (values: Items, script: BBTagScript) => InterruptableProcess<T>, minItems = 0, maxItems = Infinity) {
        this.#aggregate = aggregate;
        this.values = values;
        this.maxRepeat = maxItems;
        this.minRepeat = minItems;
    }

    public async *aggregate(_name: string, values: Items[], script: BBTagScript): InterruptableProcess<T[]> {
        const result = [];
        for (const group of values)
            result.push(yield* this.#aggregate(group, script));
        return result;
    }

    public flatUse<T>(flatten: (values: Items[], script: BBTagScript) => InterruptableProcess<T>): RepeatedFlatParameter<T, Items> {
        return new RepeatedFlatParameter(this.values, flatten, this.minRepeat, this.maxRepeat);
    }

    public flatMap<T>(flatten: (values: Items[], script: BBTagScript) => T): RepeatedFlatParameter<T, Items> {
        return new RepeatedFlatParameter<T, Items>(this.values, (v, s) => processResult(flatten(v, s)), this.minRepeat, this.maxRepeat);
    }

    public use<T>(aggregate: (values: Items, script: BBTagScript) => InterruptableProcess<T>): RepeatedAggregatedParameter<T, Items> {
        return new RepeatedAggregatedParameter(this.values, aggregate, this.minRepeat, this.maxRepeat);
    }

    public map<T>(aggregate: (values: Items, script: BBTagScript) => T): RepeatedAggregatedParameter<T, Items> {
        return new RepeatedAggregatedParameter<T, Items>(this.values, (v, s) => processResult(aggregate(v, s)));
    }
}
