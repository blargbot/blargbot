import type { BBTagScript, InterruptableSyncProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import type { SubtagParameter } from './SubtagParameter.js';

export class BBTagScriptParameter implements SubtagParameter<BBTagScript, readonly []> {
    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly values = [] as const;

    public aggregate(_name: string, _values: [], script: BBTagScript): InterruptableSyncProcess<BBTagScript> {
        return processResult(script);
    }
}
