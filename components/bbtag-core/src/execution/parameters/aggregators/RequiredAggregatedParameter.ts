import type { InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import type { SubtagParameter } from '../../SubtagParameter.js';
import { OptionalAggregatedParameter } from './OptionalAggregatedParameter.js';
import { RepeatedAggregatedParameter } from './RepeatedAggregatedParameter.js';

export class RequiredAggregatedParameter<T, Items extends readonly unknown[]> implements SubtagParameter<T, Items> {
    readonly #aggregate: (values: Items) => InterruptableProcess<T>;

    public readonly minRepeat = 1;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameter<T, Items>['values'];

    public constructor(values: SubtagParameter<T, Items>['values'], aggregate: (values: Items) => InterruptableProcess<T>) {
        this.#aggregate = aggregate;
        this.values = values;
    }

    public aggregate(_name: string, values: Items[]): InterruptableProcess<T> {
        return this.#aggregate(values[0]);
    }

    public optional<R>(fallback: R): OptionalAggregatedParameter<T, R, Items>
    public optional<R>(fallback?: R): OptionalAggregatedParameter<T, R | undefined, Items>
    public optional<R>(fallback?: R): OptionalAggregatedParameter<T, R | undefined, Items> {
        return new OptionalAggregatedParameter(this.values, this.#aggregate, fallback);
    }

    public repeat(maxItems?: number): RepeatedAggregatedParameter<T, Items>
    public repeat(minItems: number, maxItems?: number): RepeatedAggregatedParameter<T, Items>
    public repeat(minItems?: number, maxItems?: number): RepeatedAggregatedParameter<T, Items> {
        if (maxItems === undefined) {
            maxItems = minItems ?? Infinity;
            minItems = 1;
        }
        return new RepeatedAggregatedParameter(this.values, this.#aggregate, minItems, maxItems);
    }

    public use<T>(aggregate: (values: Items) => InterruptableProcess<T>): RequiredAggregatedParameter<T, Items> {
        return new RequiredAggregatedParameter(this.values, aggregate);
    }
}
