import type { InterruptableProcess } from '@bbtag/engine';

import type { SubtagParameter } from '../parameter/SubtagParameter.js';

export interface SubtagCompilationItem {
    readonly id: string;
    readonly names: Iterable<string>;
    readonly parameters: readonly SubtagParameter[];
    readonly implementation: (...args: unknown[]) => InterruptableProcess<string>;
}
