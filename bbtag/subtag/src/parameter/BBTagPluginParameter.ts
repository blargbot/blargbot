import type { BBTagPluginInstance, BBTagPluginType, BBTagScript, InterruptableSyncProcess } from '@bbtag/engine';

import { SubtagParameter } from './SubtagParameter.js';

export class BBTagPluginParameter<Type extends BBTagPluginType> extends SubtagParameter<BBTagPluginInstance<Type>, readonly []> {
    readonly #type: Type;
    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly readers = [] as const;

    public constructor(type: Type) {
        super();
        this.#type = type;
    }

    public * aggregate(_name: string, _values: [], script: BBTagScript): InterruptableSyncProcess<BBTagPluginInstance<Type>> {
        return script.process.plugins.get(this.#type);
    }
}
