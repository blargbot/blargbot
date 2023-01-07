import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

import type { SubtagArgumentReader, SubtagArgumentReaderProvider } from '../readers/SubtagArgumentReader.js';
import { BBTagParameterTransform } from './BBTagParameterTransform.js';
import { RepeatedSubtagParameter } from './RepeatedSubtagParameter.js';

export interface SubtagParameterDetails<T = unknown, Items extends readonly unknown[] = readonly unknown[]> {
    readonly minRepeat: number;
    readonly maxRepeat: number;
    readonly readers: {
        [P in keyof Items]: SubtagArgumentReader<Items[P]>;
    };

    aggregate(name: string, values: Array<[...Items]>, script: BBTagScript): InterruptableProcess<T>;
}

export abstract class SubtagParameter<T, Items extends readonly unknown[]> implements SubtagParameterDetails<T, Items> {
    public abstract minRepeat: number;
    public abstract maxRepeat: number;
    public abstract readers: { [P in keyof Items]: SubtagArgumentReader<Items[P]>; };

    public abstract aggregate(name: string, values: Array<[...Items]>, script: BBTagScript): InterruptableProcess<T>

    public map<R>(mapping: (source: T, script: BBTagScript) => Awaitable<R>): SubtagParameterDetails<Awaited<R>, Items> {
        return new BBTagParameterTransform(this, function* (src, script) {
            return mapping(src, script);
        });
    }

    public transform<R>(mapping: (source: T, script: BBTagScript) => InterruptableProcess<R>): SubtagParameterDetails<Awaited<R>, Items> {
        return new BBTagParameterTransform(this, mapping);
    }

    public repeat(minCount: number, maxCount = Infinity): RepeatedSubtagParameter<T, Items> {
        return new RepeatedSubtagParameter(this, minCount, maxCount);
    }
}

export type SubtagParameterType<P extends SubtagParameterDetails> = P extends SubtagParameterDetails<infer R> ? R : never;
export type SubtagParameterTypes<P extends readonly SubtagParameterDetails[]> = {
    [Q in keyof P]: SubtagParameterType<P[Q]>
};
