import type { InterruptableAsyncProcess } from '@bbtag/engine';
import { BBTagRuntimeError } from '@bbtag/engine';

import type { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagArgumentReader as SubtagArgumentReader } from './SubtagArgumentReader.js';

export class JsonArgumentReader<T> implements SubtagArgumentReader<T> {
    readonly #reader: (value: string) => { valid: true; value: T; } | { valid: false; };

    public readonly reader = this;
    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, reader: (value: string) => { valid: true; value: T; } | { valid: false; }, options: JsonArgumentReaderOptions) {
        this.#reader = reader;
        this.name = name;
        this.maxSize = options.maxSize;
    }

    public async * read(_name: string, arg: SubtagArgument): InterruptableAsyncProcess<T> {
        const value = yield* arg.value(this.maxSize);
        const result = this.#reader(value);
        if (result.valid)
            return result.value;
        throw new BBTagRuntimeError('Invalid JSON');
    }
}

export interface JsonArgumentReaderOptions {
    readonly maxSize: number;
}
