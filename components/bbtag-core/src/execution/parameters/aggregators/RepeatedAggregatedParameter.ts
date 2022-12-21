import type { InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import { processResult } from '../../../runtime/processResult.js';
import type { SubtagParameter } from '../../SubtagParameter.js';

export class RepeatedAggregatedParameter<T, Items extends readonly unknown[]> implements SubtagParameter<T[], Items> {
    readonly #aggregate: (values: Items) => InterruptableProcess<T>;

    public readonly minRepeat: number;
    public readonly maxRepeat: number;
    public readonly values: SubtagParameter<T[], Items>['values'];

    public constructor(values: SubtagParameter<T[], Items>['values'], aggregate: (values: Items) => InterruptableProcess<T>, minItems = 0, maxItems = Infinity) {
        this.#aggregate = aggregate;
        this.values = values;
        this.maxRepeat = maxItems;
        this.minRepeat = minItems;
    }

    public async *aggregate(_name: string, values: Items[]): InterruptableProcess<T[]> {
        const result = [];
        for (const group of values)
            result.push(yield* this.#aggregate(group));
        return result;
    }

    public use<T>(aggregate: (values: Items) => InterruptableProcess<T>): RepeatedAggregatedParameter<T, Items> {
        return new RepeatedAggregatedParameter(this.values, aggregate, this.minRepeat, this.maxRepeat);
    }

    public map<T>(aggregate: (values: Items) => T): RepeatedAggregatedParameter<T, Items> {
        return new RepeatedAggregatedParameter<T, Items>(this.values, v => processResult(aggregate(v)));
    }
}
