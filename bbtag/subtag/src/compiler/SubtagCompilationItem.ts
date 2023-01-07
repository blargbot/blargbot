import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

import type { SubtagParameterDetails, SubtagParameterTypes } from '../parameter/SubtagParameter.js';

export interface SubtagCompilationItem<Parameters extends readonly SubtagParameterDetails[] = readonly SubtagParameterDetails[]> {
    readonly id: string;
    readonly names: Iterable<string>;
    readonly parameters: Parameters;
    readonly implementation: (script: BBTagScript, ...args: SubtagParameterTypes<Parameters>) => InterruptableProcess<string>;
}
