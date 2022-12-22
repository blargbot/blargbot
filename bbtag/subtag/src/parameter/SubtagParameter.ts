import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

import type { SubtagArgumentReader } from '../readers/SubtagArgumentReader.js';

export interface SubtagParameter<T = unknown, Items extends readonly unknown[] = readonly unknown[]> {
    readonly minRepeat: number;
    readonly maxRepeat: number;
    readonly values: {
        [P in keyof Items]: SubtagArgumentReader<Items[P]>;
    };

    aggregate(name: string, values: Array<[...Items]>, script: BBTagScript): InterruptableProcess<T>;
}
