import type { BBTagScript, InterruptableSyncProcess } from '@bbtag/engine';

import { SubtagParameter } from './SubtagParameter.js';

export class BBTagScriptParameter extends SubtagParameter<BBTagScript, readonly []> {
    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly readers = [] as const;

    public *aggregate(_name: string, _values: [], script: BBTagScript): InterruptableSyncProcess<BBTagScript> {
        return script;
    }
}
