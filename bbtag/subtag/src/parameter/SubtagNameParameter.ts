import type { InterruptableProcess } from '@bbtag/engine';

import type { SubtagParameterDetails } from './SubtagParameter.js';

export class SubtagNameParameter implements SubtagParameterDetails<string, readonly []> {
    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly readers = [] as const;

    public *aggregate(name: string): InterruptableProcess<string> {
        return name;
    }
}
