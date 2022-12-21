import type { InterruptableProcess } from '../../runtime/InterruptableProcess.js';
import type { SubtagParameter } from '../SubtagParameter.js';

export interface SubtagCompilationItem {
    readonly names: Iterable<string>;
    readonly parameters: readonly SubtagParameter[];
    readonly implementation: (...args: unknown[]) => InterruptableProcess<string>;
}
