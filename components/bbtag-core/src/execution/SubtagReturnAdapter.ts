import type { InterruptableProcess } from '../runtime/InterruptableProcess.js';

export interface SubtagReturnAdapter<T> {
    getResult(value: T): InterruptableProcess<string>;
}

export type SubtagReturnAdapterType<T extends SubtagReturnAdapter<unknown>> = T extends SubtagReturnAdapter<infer R> ? R : never;
