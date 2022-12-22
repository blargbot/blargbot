import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import type { SubtagParameter } from './SubtagParameter.js';

export class RepeatedFlatParameter<T, Items extends readonly unknown[]> implements SubtagParameter<T, Items> {
    readonly #flatten: (values: Items[], script: BBTagScript) => InterruptableProcess<T>;

    public readonly minRepeat: number;
    public readonly maxRepeat: number;
    public readonly readers: SubtagParameter<T, Items>['readers'];

    public constructor(readers: SubtagParameter<T, Items>['readers'], flatten: (values: Items[], script: BBTagScript) => InterruptableProcess<T>, minItems: number, maxItems: number) {
        this.#flatten = flatten;
        this.readers = readers;
        this.maxRepeat = maxItems;
        this.minRepeat = minItems;
    }

    public aggregate(_name: string, values: Items[], script: BBTagScript): InterruptableProcess<T> {
        return this.#flatten(values, script);
    }

    public use<T>(flatten: (values: Items[], script: BBTagScript) => InterruptableProcess<T>): RepeatedFlatParameter<T, Items> {
        return new RepeatedFlatParameter(this.readers, flatten, this.minRepeat, this.maxRepeat);
    }

    public map<T>(flatten: (values: Items[], script: BBTagScript) => T): RepeatedFlatParameter<T, Items> {
        return new RepeatedFlatParameter<T, Items>(this.readers, (v, s) => processResult(flatten(v, s)), this.minRepeat, this.maxRepeat);
    }
}
