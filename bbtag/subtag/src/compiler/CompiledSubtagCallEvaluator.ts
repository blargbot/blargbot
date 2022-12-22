import type { SubtagCallEvaluator } from '@bbtag/engine';

import type { SubtagCompilationItem } from './SubtagCompilationItem.js';
import { SubtagCompilationKernel } from './SubtagCompilationKernel.js';

export class CompiledSubtagCallEvaluator implements SubtagCallEvaluator {
    public readonly execute: SubtagCallEvaluator['execute'];

    public constructor(sources: Iterable<SubtagCompilationItem>) {
        const kernel = new SubtagCompilationKernel();
        for (const source of sources)
            kernel.add(source);
        this.execute = kernel.compile();
    }
}
