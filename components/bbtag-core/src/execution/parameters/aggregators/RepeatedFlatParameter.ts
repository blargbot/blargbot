import type { InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import type { SubtagParameter } from '../../SubtagParameter.js';

export class RepeatedFlatParameter<T, Items extends readonly unknown[]> implements SubtagParameter<T, Items> {
    readonly #flatten: (values: Items[]) => InterruptableProcess<T>;

    public readonly minRepeat: number;
    public readonly maxRepeat: number;
    public readonly values: SubtagParameter<T, Items>['values'];

    public constructor(values: SubtagParameter<T, Items>['values'], flatten: (values: Items[]) => InterruptableProcess<T>, minItems: number, maxItems: number) {
        this.#flatten = flatten;
        this.values = values;
        this.maxRepeat = maxItems;
        this.minRepeat = minItems;
    }

    public aggregate(_name: string, values: Items[]): InterruptableProcess<T> {
        return this.#flatten(values);
    }

    public use<T>(aggregate: (values: Items[]) => InterruptableProcess<T>): RepeatedFlatParameter<T, Items> {
        return new RepeatedFlatParameter(this.values, aggregate, this.minRepeat, this.maxRepeat);
    }
}
