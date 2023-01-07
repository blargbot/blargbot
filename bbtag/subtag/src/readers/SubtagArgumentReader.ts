import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

import type { SubtagArgument } from '../SubtagArgument.js';

export interface SubtagArgumentReader<T = unknown> extends SubtagArgumentReaderProvider<T> {
    readonly reader: this;
    readonly name: string;
    readonly maxSize: number;

    read(name: string, arg: SubtagArgument, script: BBTagScript): InterruptableProcess<T>;
}

export interface SubtagArgumentReaderProvider<T = unknown> {
    readonly reader: SubtagArgumentReader<T>;
}

export type SubtagArgumentReaderType<T extends SubtagArgumentReaderProvider> = T extends SubtagArgumentReaderProvider<infer R> ? R : never;
export type SubtagArgumentReaderTypes<T extends readonly SubtagArgumentReaderProvider[]> = {
    [P in keyof T]: SubtagArgumentReaderType<T[P]>
}
