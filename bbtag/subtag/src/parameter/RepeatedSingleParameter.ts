import type { InterruptableProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import type { SubtagParameter } from './SubtagParameter.js';

export class RepeatedSingleParameter<T> implements SubtagParameter<T[], [T]> {
    public readonly minRepeat: number;
    public readonly maxRepeat: number;
    public readonly values: SubtagParameter<T[], [T]>['values'];

    public constructor(value: SubtagParameter<T[], [T]>['values'][0], minItems = 0, maxItems = Infinity) {
        this.values = [value];
        this.maxRepeat = maxItems;
        this.minRepeat = minItems;
    }

    public aggregate(_name: string, values: Array<[T]>): InterruptableProcess<T[]> {
        return processResult(values.map(v => v[0]));
    }
}
