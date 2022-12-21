import type { InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import { processResult } from '../../../runtime/processResult.js';
import type { SubtagArgument } from '../../SubtagArgument.js';
import type { SubtagParameter, SubtagParameterDetails } from '../../SubtagParameter.js';

export default class OptionalStringParameter<T> implements SubtagParameter<string | T> {
    readonly #fallback: T;

    public readonly minRepeat = 0;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameterDetails[];

    public constructor(name: string, fallback: T, maxSize: number) {
        this.#fallback = fallback;
        this.values = [{
            name,
            maxSize
        }];
    }

    public getValue(_name: string, [value]: SubtagArgument[] | [undefined]): InterruptableProcess<string | T> {
        return value?.value() ?? processResult(this.#fallback);
    }
}
