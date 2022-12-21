import type { BBTagScript } from '../runtime/BBTagScript.js';
import type { InterruptableProcess } from '../runtime/InterruptableProcess.js';
import type { SubtagArgument } from './SubtagArgument.js';

export interface SubtagParameter<T = unknown, Items extends readonly unknown[] = readonly unknown[]> {
    readonly minRepeat: number;
    readonly maxRepeat: number;
    readonly values: {
        [P in keyof Items]: SubtagParameterItem<Items[P]>
    };

    aggregate(name: string, values: Array<[...Items]>, script: BBTagScript): InterruptableProcess<T>;
}

export interface SubtagParameterItem<T = unknown> {
    readonly name: string;
    readonly maxSize: number;

    getValue(name: string, arg: SubtagArgument, script: BBTagScript): InterruptableProcess<T>;
}

export type SubtagParameterItemType<T extends SubtagParameterItem> = T extends SubtagParameterItem<infer R> ? R : never;
export type SubtagParameterItemTypes<T extends readonly SubtagParameterItem[]> = {
    [P in keyof T]: SubtagParameterItemType<T[P]>
}
