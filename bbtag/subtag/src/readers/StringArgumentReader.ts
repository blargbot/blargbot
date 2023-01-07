import type { InterruptableAsyncProcess } from '@bbtag/engine';

import type { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagArgumentReader as SubtagArgumentReader } from './SubtagArgumentReader.js';

export class StringArgumentReader implements SubtagArgumentReader<string> {
    readonly #ifEmpty: string;

    public readonly reader = this;
    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: StringArgumentReaderOptions) {
        this.#ifEmpty = options.ifEmpty;
        this.name = name;
        this.maxSize = options.maxSize;
    }

    public async * read(_name: string, arg: SubtagArgument): InterruptableAsyncProcess<string> {
        const value = yield* arg.value(this.maxSize);
        return value.length === 0 ? this.#ifEmpty : value;
    }
}

export interface StringArgumentReaderOptions {
    readonly maxSize: number;
    readonly ifEmpty: string;
}
