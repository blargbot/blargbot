import type { InterruptableProcess } from '@bbtag/engine';

export interface SubtagReturnAdapter<T = unknown> {
    getResult(value: T): InterruptableProcess<string>;
}

export type SubtagReturnAdapterType<T extends SubtagReturnAdapter<unknown>> = T extends SubtagReturnAdapter<infer R> ? R : never;
