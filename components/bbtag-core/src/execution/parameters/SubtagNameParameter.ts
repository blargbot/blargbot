import type { InterruptableSyncProcess } from '../../runtime/InterruptableProcess.js';
import { processResult } from '../../runtime/processResult.js';
import type { SubtagParameter } from '../SubtagParameter.js';

export class SubtagNameParameter implements SubtagParameter<string> {
    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly values = [];

    public getValue(name: string): InterruptableSyncProcess<string> {
        return processResult(name);
    }
}
