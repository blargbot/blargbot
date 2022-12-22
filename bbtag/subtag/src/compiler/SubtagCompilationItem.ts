import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

import type { SubtagParameter, SubtagParameterTypes } from '../parameter/SubtagParameter.js';

export interface SubtagCompilationItem<Parameters extends readonly SubtagParameter[] = readonly SubtagParameter[]> {
    readonly id: string;
    readonly names: Iterable<string>;
    readonly parameters: Parameters;
    readonly implementation: (script: BBTagScript, ...args: SubtagParameterTypes<Parameters>) => InterruptableProcess<string>;
}
