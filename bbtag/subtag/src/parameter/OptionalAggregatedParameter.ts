import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import { RequiredAggregatedParameter } from './RequiredAggregatedParameter.js';
import type { SubtagParameter } from './SubtagParameter.js';

export class OptionalAggregatedParameter<T, R, Items extends readonly unknown[]> implements SubtagParameter<T | R, Items> {
    readonly #aggregate: (values: Items, script: BBTagScript) => InterruptableProcess<T>;
    readonly #fallback: R;

    public readonly minRepeat = 0;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameter<T, Items>['values'];

    public constructor(values: SubtagParameter<T, Items>['values'], aggregate: (values: Items, script: BBTagScript) => InterruptableProcess<T>, fallback: R) {
        this.#aggregate = aggregate;
        this.#fallback = fallback;
        this.values = values;
    }

    public aggregate(_name: string, values: Items[], script: BBTagScript): InterruptableProcess<T | R> {
        if (values.length === 0)
            return processResult(this.#fallback);
        return this.#aggregate(values[0], script);
    }

    public required(): RequiredAggregatedParameter<T, Items> {
        return new RequiredAggregatedParameter(this.values, this.#aggregate);
    }

    public use<T>(aggregate: (values: Items, script: BBTagScript) => InterruptableProcess<T>): OptionalAggregatedParameter<T, R, Items> {
        return new OptionalAggregatedParameter(this.values, aggregate, this.#fallback);
    }
}
