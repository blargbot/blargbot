import type { InterruptableProcess } from '@bbtag/engine';
import { BBTagRuntimeError, processResult } from '@bbtag/engine';

import type { SubtagArgumentReader } from '../readers/SubtagArgumentReader.js';
import { SubtagArgument } from '../SubtagArgument.js';
import { OptionalSingleParameter } from './OptionalSingleParameter.js';
import { RepeatedSingleParameter } from './RepeatedSingleParameter.js';
import type { SubtagParameter } from './SubtagParameter.js';

export class RequiredSingleParameter<T> implements SubtagParameter<T, [T]>, SubtagArgumentReader<T> {
    public readonly minRepeat = 1;
    public readonly maxRepeat = 1;
    public readonly readers: SubtagParameter<T, [T]>['readers'];
    public readonly name: string;
    public readonly maxSize: number;
    public readonly read: SubtagArgumentReader<T>['read'];

    public constructor(reader: SubtagArgumentReader<T>) {
        this.readers = [reader];
        this.name = reader.name;
        this.maxSize = reader.maxSize;
        this.read = reader.read.bind(reader);
    }

    public aggregate(_name: string, values: Array<[T]>): InterruptableProcess<T> {
        return processResult(values[0][0]);
    }

    public optional(fallback?: undefined, ignoreEmpty?: boolean): OptionalSingleParameter<T, undefined>
    public optional<R>(fallback: R, ignoreEmpty?: boolean): OptionalSingleParameter<T, R>
    public optional<R>(fallback?: R, ignoreEmpty = false): OptionalSingleParameter<T, R | undefined> {
        return new OptionalSingleParameter(this.readers[0], fallback, ignoreEmpty);
    }

    public repeat(maxItems?: number): RepeatedSingleParameter<T>
    public repeat(minItems: number, maxItems?: number): RepeatedSingleParameter<T>
    public repeat(minItems?: number, maxItems?: number): RepeatedSingleParameter<T> {
        if (maxItems === undefined) {
            maxItems = minItems ?? Infinity;
            minItems = 1;
        }
        return new RepeatedSingleParameter(this.readers[0], minItems, maxItems);
    }

    public map<R>(mapper: (value: T) => R): RequiredSingleParameter<R> {
        const reader = this.readers[0];
        return new RequiredSingleParameter<R>({
            ...reader,
            async * read(name, arg, script) {
                const value = yield* reader.read(name, arg, script);
                return mapper(value);
            }
        });
    }

    public ifEmpty<Q>(value: Q): RequiredSingleParameter<T | Q> {
        const v = this.readers[0];
        return new RequiredSingleParameter<T | Q>({
            ...v,
            async * read(name, arg, script) {
                const res = yield* arg.value(v.maxSize);
                if (res.length === 0)
                    return value;
                return yield* v.read(name, arg, script);
            }
        });
    }

    public tryFallback(): RequiredSingleParameter<T> {
        const value = this.readers[0];
        return new RequiredSingleParameter({
            ...value,
            read(name, arg, script) {
                let error;
                try {
                    return value.read(name, arg, script);
                } catch (err) {
                    error = err;
                }

                const fallback = script.currentClosure.fallback;
                if (fallback === undefined)
                    throw error;

                if (!(error instanceof BBTagRuntimeError))
                    throw error;

                try {
                    arg = new SubtagArgument(script, arg.index, {
                        ...arg.template,
                        source: fallback,
                        statements: [fallback]
                    });
                    return value.read(name, arg, script);
                } catch {
                    throw error;
                }
            }
        });
    }
}
