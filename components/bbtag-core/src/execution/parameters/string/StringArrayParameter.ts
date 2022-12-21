import type { InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import type { SubtagArgument } from '../../SubtagArgument.js';
import type { SubtagParameter, SubtagParameterDetails } from '../../SubtagParameter.js';

export default class StringArrayParameter implements SubtagParameter<string[]> {
    public readonly minRepeat: number;
    public readonly maxRepeat: number;
    public readonly values: SubtagParameterDetails[];

    public constructor(name: string, minRepeat: number, maxRepeat: number, maxSize: number) {
        this.maxRepeat = maxRepeat;
        this.minRepeat = minRepeat;
        this.values = [{
            name,
            maxSize
        }];
    }

    public async * getValue(_name: string, values: SubtagArgument[]): InterruptableProcess<string[]> {
        const result = [];
        for (const value of values)
            result.push(yield* value.value());
        return result;
    }
}
