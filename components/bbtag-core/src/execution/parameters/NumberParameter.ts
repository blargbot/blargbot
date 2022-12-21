import { NotANumberError } from '../../errors/NotANumberError.js';
import type { InterruptableProcess } from '../../runtime/InterruptableProcess.js';
import type { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagParameter, SubtagParameterDetails } from '../SubtagParameter.js';

export class NumberParameter implements SubtagParameter<number> {
    public readonly minRepeat = 1;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameterDetails[];

    public constructor(name: string, maxLength: number) {
        this.values = [{
            name,
            maxSize: maxLength
        }];
    }

    public async * getValue(_name: string, [value]: SubtagArgument[]): InterruptableProcess<number> {
        const strValue = yield* value.value();
        const result = Number(strValue);
        if (isNaN(result))
            throw new NotANumberError(strValue);
        return result;
    }
}
