import type { BBTagScript } from '../../runtime/BBTagScript.js';
import type { InterruptableSyncProcess } from '../../runtime/InterruptableProcess.js';
import { processResult } from '../../runtime/processResult.js';
import type { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagParameter } from '../SubtagParameter.js';

export class BBTagScriptParameter implements SubtagParameter<BBTagScript> {
    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly values = [];

    public getValue(_name: string, _values: SubtagArgument[], script: BBTagScript): InterruptableSyncProcess<BBTagScript> {
        return processResult(script);
    }
}
