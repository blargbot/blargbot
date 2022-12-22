import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

import type { SubtagArgumentReader } from '../readers/SubtagArgumentReader.js';

export interface SubtagParameter<T = unknown, Items extends readonly unknown[] = readonly unknown[]> {
    readonly minRepeat: number;
    readonly maxRepeat: number;
    readonly readers: {
        [P in keyof Items]: SubtagArgumentReader<Items[P]>;
    };

    aggregate(name: string, values: Array<[...Items]>, script: BBTagScript): InterruptableProcess<T>;
}

export type SubtagParameterType<P extends SubtagParameter> = P extends SubtagParameter<infer R> ? R : never;
export type SubtagParameterTypes<P extends readonly SubtagParameter[]> = {
    [Q in keyof P]: SubtagParameterType<P[Q]>
};
