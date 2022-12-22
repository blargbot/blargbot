import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import type { SubtagParameter } from './SubtagParameter.js';

export class FallbackParameter implements SubtagParameter<string | undefined, readonly []> {
    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly values = [] as const;

    public aggregate(_name: string, _values: [], script: BBTagScript): InterruptableProcess<string | undefined> {
        return processResult(script.currentClosure.fallback);
    }
}
