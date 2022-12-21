import type { InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import { processResult } from '../../../runtime/processResult.js';
import type { SubtagParameter } from '../../SubtagParameter.js';
import { RequiredAggregatedParameter } from './RequiredAggregatedParameter.js';

export class OptionalAggregatedParameter<T, R, Items extends readonly unknown[]> implements SubtagParameter<T | R, Items> {
    readonly #aggregate: (values: Items) => InterruptableProcess<T>;
    readonly #fallback: R;

    public readonly minRepeat = 0;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameter<T, Items>['values'];

    public constructor(values: SubtagParameter<T, Items>['values'], aggregate: (values: Items) => InterruptableProcess<T>, fallback: R) {
        this.#aggregate = aggregate;
        this.#fallback = fallback;
        this.values = values;
    }

    public aggregate(_name: string, values: Items[]): InterruptableProcess<T | R> {
        if (values.length === 0)
            return processResult(this.#fallback);
        return this.#aggregate(values[0]);
    }

    public required(): RequiredAggregatedParameter<T, Items> {
        return new RequiredAggregatedParameter(this.values, this.#aggregate);
    }

    public use<T>(aggregate: (values: Items) => InterruptableProcess<T>): OptionalAggregatedParameter<T, R, Items> {
        return new OptionalAggregatedParameter(this.values, aggregate, this.#fallback);
    }
}
