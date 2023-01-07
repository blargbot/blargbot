import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

import { SubtagParameter } from './SubtagParameter.js';

export class FallbackParameter extends SubtagParameter<string | undefined, readonly []> {
    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly readers = [] as const;

    public * aggregate(_name: string, _values: [], script: BBTagScript): InterruptableProcess<string | undefined> {
        return script.currentClosure.fallback;
    }
}
