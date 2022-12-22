import type { InterruptableProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import type { SubtagParameter } from './SubtagParameter.js';

export class SubtagNameParameter implements SubtagParameter<string, readonly []> {
    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly values = [] as const;

    public aggregate(name: string): InterruptableProcess<string> {
        return processResult(name);
    }
}
