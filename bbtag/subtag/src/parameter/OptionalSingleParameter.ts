import type { InterruptableProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import type { SubtagParameter } from './SubtagParameter.js';

export class OptionalSingleParameter<T, R> implements SubtagParameter<T | R, [T | undefined]> {
    readonly #fallback: R;

    public readonly minRepeat = 0;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameter<T, [T | undefined]>['values'];

    public constructor(value: SubtagParameter<T, [T | undefined]>['values'][0], fallback: R) {
        this.values = [value];
        this.#fallback = fallback;
    }

    public aggregate(_name: string, values: Array<[T | undefined]>): InterruptableProcess<T | R> {
        return processResult(values[0]?.[0] ?? this.#fallback);
    }

    public ignoreEmpty(): OptionalSingleParameter<T, R> {
        const value = this.values[0];
        return new OptionalSingleParameter<T, R>({
            ...value,
            async * read(name, arg, script) {
                const res = yield* arg.value(value.maxSize);
                if (res.length === 0)
                    return undefined;
                return yield* value.read(name, arg, script);
            }
        }, this.#fallback);
    }
}
