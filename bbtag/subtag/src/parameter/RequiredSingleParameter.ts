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
    public readonly values: SubtagParameter<T, [T]>['values'];
    public readonly name: string;
    public readonly maxSize: number;
    public readonly read: SubtagArgumentReader<T>['read'];

    public constructor(value: SubtagParameter<T, [T]>['values'][0]) {
        this.values = [value];
        this.name = value.name;
        this.maxSize = value.maxSize;
        this.read = value.read.bind(value);
    }

    public aggregate(_name: string, values: Array<[T]>): InterruptableProcess<T> {
        return processResult(values[0][0]);
    }

    public optional<R>(fallback: R): OptionalSingleParameter<T, R>
    public optional(fallback?: undefined): OptionalSingleParameter<T, undefined>
    public optional<R>(fallback?: R): OptionalSingleParameter<T, R | undefined> {
        return new OptionalSingleParameter(this.values[0], fallback);
    }

    public repeat(maxItems?: number): RepeatedSingleParameter<T>
    public repeat(minItems: number, maxItems?: number): RepeatedSingleParameter<T>
    public repeat(minItems?: number, maxItems?: number): RepeatedSingleParameter<T> {
        if (maxItems === undefined) {
            maxItems = minItems ?? Infinity;
            minItems = 1;
        }
        return new RepeatedSingleParameter(this.values[0], minItems, maxItems);
    }

    public fallback(): RequiredSingleParameter<T> {
        const value = this.values[0];
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
                    arg = new SubtagArgument(script, {
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
