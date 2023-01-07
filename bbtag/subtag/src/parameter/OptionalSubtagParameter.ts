import type { InterruptableProcess } from '@bbtag/engine';

import type { SubtagArgumentReader, SubtagArgumentReaderProvider } from '../index.js';
import { EmptyArgumentReader } from '../readers/EmptyArgumentReader.js';
import { FallbackAttemptingArgumentReader } from '../readers/FallbackAttemptingArgumentReader.js';
import { SubtagParameter } from './SubtagParameter.js';

export class OptionalSubtagParameter<T, R> extends SubtagParameter<NonNullable<T> | R, [T | undefined]> implements SubtagArgumentReaderProvider<T> {
    readonly #fallback: () => R;
    public readonly minRepeat = 0;
    public readonly maxRepeat = 1;
    public readonly readers: SubtagParameter<T, [T | undefined]>['readers'];
    public readonly reader: SubtagArgumentReader<T>;

    public constructor(reader: SubtagArgumentReaderProvider<T>, fallback: () => R) {
        super();
        this.readers = [reader.reader];
        this.reader = reader.reader;
        this.#fallback = fallback;
    }

    public *aggregate(_name: string, values: Array<[T | undefined]>): InterruptableProcess<NonNullable<T> | R> {
        return values[0]?.[0] ?? this.#fallback();
    }

    public default<Q>(fallback: () => Q): OptionalSubtagParameter<T | Q, R>;
    public default(fallback?: () => undefined): OptionalSubtagParameter<T | undefined, R>
    public default(fallback = () => undefined): OptionalSubtagParameter<T | undefined, R> {
        return new OptionalSubtagParameter(new EmptyArgumentReader(this.reader, fallback), this.#fallback);
    }

    public tryFallback(): OptionalSubtagParameter<T, R> {
        return new OptionalSubtagParameter(new FallbackAttemptingArgumentReader(this.reader), this.#fallback);
    }
}
