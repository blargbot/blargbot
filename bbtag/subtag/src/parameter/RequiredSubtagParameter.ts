import type { InterruptableProcess } from '@bbtag/engine';

import type { SubtagArgumentReader, SubtagArgumentReaderProvider } from '../index.js';
import { EmptyArgumentReader } from '../readers/EmptyArgumentReader.js';
import { FallbackAttemptingArgumentReader } from '../readers/FallbackAttemptingArgumentReader.js';
import { OptionalSubtagParameter } from './OptionalSubtagParameter.js';
import { SubtagParameter } from './SubtagParameter.js';

export class RequiredSubtagParameter<T> extends SubtagParameter<T, [T]> implements SubtagArgumentReaderProvider<T> {
    public readonly minRepeat = 1;
    public readonly maxRepeat = 1;
    public readonly readers: SubtagParameter<T, [T]>['readers'];
    public readonly reader: SubtagArgumentReader<T>;

    public constructor(reader: SubtagArgumentReaderProvider<T>) {
        super();
        this.readers = [reader.reader];
        this.reader = reader.reader;
    }

    public *aggregate(_name: string, values: Array<[T]>): InterruptableProcess<T> {
        return values[0][0];
    }

    public optional<R>(fallback: () => R, alsoDefault: false): OptionalSubtagParameter<T, R>;
    public optional<R>(fallback: () => R, alsoDefault?: true): OptionalSubtagParameter<T | R, R>;
    public optional<R>(fallback: () => R, alsoDefault?: boolean): OptionalSubtagParameter<T | R, R>;
    public optional<R>(fallback: R, alsoDefault: false): OptionalSubtagParameter<T, R>;
    public optional<R>(fallback: R, alsoDefault?: true): OptionalSubtagParameter<T | R, R>;
    public optional<R>(fallback: R, alsoDefault?: boolean): OptionalSubtagParameter<T | R, R>;
    public optional(fallback?: () => undefined, alsoDefault?: true): OptionalSubtagParameter<T | undefined, undefined>
    public optional(fallback?: () => undefined, alsoDefault?: boolean): OptionalSubtagParameter<T | undefined, undefined>
    public optional<R>(fallback?: R | (() => R), alsoDefault = true): OptionalSubtagParameter<T | R, R> {
        const fb = typeof fallback === 'function' ? fallback as () => R : () => fallback as R;
        const reader = alsoDefault ? new EmptyArgumentReader(this.reader, fb) : this.reader;
        return new OptionalSubtagParameter(reader, fb);
    }

    public default<R>(fallback: () => R): RequiredSubtagParameter<T | R>;
    public default<R>(fallback: R): RequiredSubtagParameter<T | R>;
    public default(fallback?: () => undefined): RequiredSubtagParameter<T | undefined>
    public default<R>(fallback?: R | (() => R)): RequiredSubtagParameter<T | R> {
        const fb = typeof fallback === 'function' ? fallback as () => R : () => fallback as R;
        return new RequiredSubtagParameter(new EmptyArgumentReader(this.reader, fb));
    }

    public tryFallback(): RequiredSubtagParameter<T> {
        return new RequiredSubtagParameter(new FallbackAttemptingArgumentReader(this.reader));
    }
}
