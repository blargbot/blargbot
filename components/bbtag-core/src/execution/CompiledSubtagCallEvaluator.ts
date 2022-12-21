import type { SubtagCompilationItem } from './compilation/SubtagCompilationItem.js';
import { SubtagCompilationKernel } from './compilation/SubtagCompilationKernel.js';
import type { SubtagCallEvaluator } from './SubtagCallEvaluator.js';

export class CompiledSubtagCallEvaluator implements SubtagCallEvaluator {
    public readonly execute: SubtagCallEvaluator['execute'];

    public constructor(sources: Iterable<SubtagCompilationItem>) {
        const kernel = new SubtagCompilationKernel();
        for (const source of sources)
            kernel.add(source);
        this.execute = kernel.compile();
    }
}
