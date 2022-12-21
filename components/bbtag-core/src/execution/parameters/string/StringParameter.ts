import type { InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import type { SubtagArgument } from '../../SubtagArgument.js';
import type { SubtagParameter, SubtagParameterDetails } from '../../SubtagParameter.js';

export default class StringParameter implements SubtagParameter<string> {
    public readonly minRepeat = 1;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameterDetails[];

    public constructor(name: string, maxSize: number) {
        this.values = [{
            name,
            maxSize
        }];
    }

    public getValue(_name: string, [value]: SubtagArgument[]): InterruptableProcess<string> {
        return value.value();
    }
}
