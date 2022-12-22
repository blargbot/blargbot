import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

export interface SubtagResult<T = unknown> {
    execute(value: T, script: BBTagScript): InterruptableProcess<string>;
}

export type SubtagResultType<T extends SubtagResult<unknown>> = T extends SubtagResult<infer R> ? R : never;
