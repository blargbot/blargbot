import type { InterruptableProcess } from '@bbtag/engine';

import { SubtagParameter } from './SubtagParameter.js';

export class SubtagParameterGroup<Items extends readonly unknown[]> extends SubtagParameter<Items, Items> {
    public readonly minRepeat = 1;
    public readonly maxRepeat = 1;

    public readonly readers: SubtagParameter<Items, Items>['readers'];

    public constructor(readers: SubtagParameter<Items, Items>['readers']) {
        super();
        this.readers = readers;
    }

    public *aggregate(_name: string, values: Array<[...Items]>): InterruptableProcess<Items> {
        return values[0];
    }
}
