import type { InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import { processResult } from '../../../runtime/processResult.js';
import type { SubtagParameter } from '../../SubtagParameter.js';
import { RequiredSingleParameter } from './RequiredSingleParameter.js';

export class OptionalSingleParameter<T, R> implements SubtagParameter<T | R, [T]> {
    readonly #fallback: R;

    public readonly minRepeat = 0;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameter<T, [T]>['values'];

    public constructor(value: SubtagParameter<T, [T]>['values'][0], fallback: R) {
        this.values = [value];
        this.#fallback = fallback;
    }

    public aggregate(_name: string, values: Array<[T]>): InterruptableProcess<T | R> {
        return processResult(values[0]?.[0] ?? this.#fallback);
    }

    public required(): RequiredSingleParameter<T> {
        return new RequiredSingleParameter(this.values[0]);
    }
}
