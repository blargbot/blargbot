import type { BBTagPluginInstance } from '../../plugins/BBTagPluginInstance.js';
import type { BBTagPluginType } from '../../plugins/BBTagPluginType.js';
import type { BBTagScript } from '../../runtime/BBTagScript.js';
import type { InterruptableSyncProcess } from '../../runtime/InterruptableProcess.js';
import { processResult } from '../../runtime/processResult.js';
import type { SubtagParameter } from '../SubtagParameter.js';

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
