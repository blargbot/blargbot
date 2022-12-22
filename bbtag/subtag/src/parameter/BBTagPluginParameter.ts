import type { BBTagPluginInstance, BBTagPluginType, BBTagScript, InterruptableSyncProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import type { SubtagParameter } from './SubtagParameter.js';

export class BBTagPluginParameter<Type extends BBTagPluginType> implements SubtagParameter<BBTagPluginInstance<Type>, readonly []> {
    readonly #type: Type;
    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly values = [] as const;

    public constructor(type: Type) {
        this.#type = type;
    }

    public aggregate(_name: string, _values: [], script: BBTagScript): InterruptableSyncProcess<BBTagPluginInstance<Type>> {
        return processResult(script.process.plugins.get(this.#type));
    }
}
