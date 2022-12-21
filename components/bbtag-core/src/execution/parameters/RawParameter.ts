import type { InterruptableSyncProcess } from '../../runtime/InterruptableProcess.js';
import { processResult } from '../../runtime/processResult.js';
import type { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagParameter, SubtagParameterDetails } from '../SubtagParameter.js';

export class StringParameter implements SubtagParameter<string> {
    public readonly minRepeat = 1;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameterDetails[];

    public constructor(name: string, maxLength: number) {
        this.values = [{
            name,
            maxSize: maxLength
        }];
    }

    public getValue(_name: string, [value]: SubtagArgument[]): InterruptableSyncProcess<string> {
        return processResult(value.template.source);
    }
}
