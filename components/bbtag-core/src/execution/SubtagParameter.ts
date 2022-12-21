import type { BBTagScript } from '../runtime/BBTagScript.js';
import type { InterruptableProcess } from '../runtime/InterruptableProcess.js';
import type { SubtagArgument } from './SubtagArgument.js';

export interface SubtagParameter<T = unknown> {
    readonly minRepeat: number;
    readonly maxRepeat: number;
    readonly values: readonly SubtagParameterDetails[];
    getValue(name: string, values: SubtagArgument[], script: BBTagScript): InterruptableProcess<T>;
}

export interface SubtagParameterDetails {
    readonly name: string;
    readonly maxSize: number;
}
