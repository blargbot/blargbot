import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

import { OptionalAggregatedParameter } from './OptionalAggregatedParameter.js';
import { RepeatedAggregatedParameter } from './RepeatedAggregatedParameter.js';
import type { SubtagParameter } from './SubtagParameter.js';

export class RequiredAggregatedParameter<T, Items extends readonly unknown[]> implements SubtagParameter<T, Items> {
    readonly #aggregate: (values: Items, script: BBTagScript) => InterruptableProcess<T>;

    public readonly minRepeat = 1;
    public readonly maxRepeat = 1;
    public readonly readers: SubtagParameter<T, Items>['readers'];

    public constructor(readers: SubtagParameter<T, Items>['readers'], aggregate: (values: Items, script: BBTagScript) => InterruptableProcess<T>) {
        this.#aggregate = aggregate;
        this.readers = readers;
    }

    public aggregate(_name: string, values: Items[], script: BBTagScript): InterruptableProcess<T> {
        return this.#aggregate(values[0], script);
    }

    public optional<R>(fallback: R): OptionalAggregatedParameter<T, R, Items>
    public optional<R>(fallback?: R): OptionalAggregatedParameter<T, R | undefined, Items>
    public optional<R>(fallback?: R): OptionalAggregatedParameter<T, R | undefined, Items> {
        return new OptionalAggregatedParameter(this.readers, this.#aggregate, fallback);
    }

    public repeat(maxItems?: number): RepeatedAggregatedParameter<T, Items>
    public repeat(minItems: number, maxItems?: number): RepeatedAggregatedParameter<T, Items>
    public repeat(minItems?: number, maxItems?: number): RepeatedAggregatedParameter<T, Items> {
        if (maxItems === undefined) {
            maxItems = minItems ?? Infinity;
            minItems = 1;
        }
        return new RepeatedAggregatedParameter(this.readers, this.#aggregate, minItems, maxItems);
    }

    public use<T>(aggregate: (values: Items, script: BBTagScript) => InterruptableProcess<T>): RequiredAggregatedParameter<T, Items> {
        return new RequiredAggregatedParameter(this.readers, aggregate);
    }
}
