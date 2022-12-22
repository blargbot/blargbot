import type { InterruptableProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import type { SubtagArgumentReader } from '../index.js';
import type { SubtagParameter } from './SubtagParameter.js';

export class RepeatedSingleParameter<T> implements SubtagParameter<T[], [T]> {
    public readonly minRepeat: number;
    public readonly maxRepeat: number;
    public readonly readers: SubtagParameter<T[], [T]>['readers'];

    public constructor(reader: SubtagArgumentReader<T>, minItems = 0, maxItems = Infinity) {
        this.readers = [reader];
        this.maxRepeat = maxItems;
        this.minRepeat = minItems;
    }

    public aggregate(_name: string, values: Array<[T]>): InterruptableProcess<T[]> {
        return processResult(values.map(v => v[0]));
    }
}
