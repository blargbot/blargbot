import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

export interface SubtagResultAdapter<T = unknown> {
    execute(value: T, script: BBTagScript): InterruptableProcess<string>;
}

export type SubtagResultType<T extends SubtagResultAdapter<unknown>> = T extends SubtagResultAdapter<infer R> ? R : never;
