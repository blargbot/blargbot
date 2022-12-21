import type { InterruptableProcess, InterruptableSyncProcess } from '../../runtime/InterruptableProcess.js';
import { processResult } from '../../runtime/processResult.js';
import type { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagParameter, SubtagParameterDetails } from '../SubtagParameter.js';

export class DeferredParameter implements SubtagParameter<() => InterruptableProcess<string>> {
    public readonly minRepeat = 1;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameterDetails[];

    public constructor(name: string, maxLength: number) {
        this.values = [{
            name,
            maxSize: maxLength
        }];
    }

    public getValue(name: string, [value]: SubtagArgument[]): InterruptableSyncProcess<() => InterruptableProcess<string>> {
        if (value.isEvaluated)
            throw new Error(`Deferred argument has already been executed! ${JSON.stringify({ subtag: name, parameter: this.values[0].name })}`);
        return processResult(() => value.execute());
    }
}
