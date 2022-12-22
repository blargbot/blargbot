import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

import type { SubtagArgument } from '../SubtagArgument.js';

export interface SubtagArgumentReader<T = unknown> {
    readonly name: string;
    readonly maxSize: number;

    read(name: string, arg: SubtagArgument, script: BBTagScript): InterruptableProcess<T>;
}

export type SubtagArgumentReaderType<T extends SubtagArgumentReader> = T extends SubtagArgumentReader<infer R> ? R : never;
export type SubtagArgumentReaderTypes<T extends readonly SubtagArgumentReader[]> = {
    [P in keyof T]: SubtagArgumentReaderType<T[P]>
}
