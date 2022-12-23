import type { InterruptableProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import type { SubtagArgumentReader } from '../index.js';
import { RepeatedSingleParameter } from '../index.js';
import { RequiredSingleParameter } from './RequiredSingleParameter.js';
import type { SubtagParameter } from './SubtagParameter.js';

export class OptionalSingleParameter<T, R> implements SubtagParameter<NonNullable<T> | R, [T | undefined]> {
    readonly #fallback: R;

    public readonly minRepeat = 0;
    public readonly maxRepeat = 1;
    public readonly readers: SubtagParameter<T, [T | undefined]>['readers'];
    #reader: SubtagArgumentReader<T>;

    public constructor(reader: SubtagArgumentReader<T>, fallback: R, ignoreEmpty: boolean) {
        this.#fallback = fallback;
        this.#reader = reader;
        this.readers = [ignoreEmpty ? reader : {
            ...reader,
            async * read(name, arg, script) {
                const res = yield* arg.value(reader.maxSize);
                if (res.length === 0)
                    return undefined;
                return yield* reader.read(name, arg, script);
            }
        }];
    }

    public required(): RequiredSingleParameter<T> {
        return new RequiredSingleParameter(this.#reader);
    }

    public repeat(maxItems?: number): RepeatedSingleParameter<T>
    public repeat(minItems: number, maxItems?: number): RepeatedSingleParameter<T>
    public repeat(minItems?: number, maxItems?: number): RepeatedSingleParameter<T> {
        if (maxItems === undefined) {
            maxItems = minItems ?? Infinity;
            minItems = 0;
        }
        return new RepeatedSingleParameter(this.#reader, minItems, maxItems);
    }

    public aggregate(_name: string, values: Array<[T | undefined]>): InterruptableProcess<NonNullable<T> | R> {
        return processResult(values[0]?.[0] ?? this.#fallback);
    }

    public ignoreEmpty(): OptionalSingleParameter<T, R> {
        return new OptionalSingleParameter(this.#reader, this.#fallback, true);
    }
}
