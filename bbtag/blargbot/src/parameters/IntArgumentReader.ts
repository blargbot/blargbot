import type { BBTagScript, InterruptableAsyncProcess } from '@bbtag/engine';
import type { SubtagArgument, SubtagArgumentReader } from '@bbtag/subtag';

import { NotANumberError } from '../index.js';
import { NumberPlugin } from '../plugins/NumberPlugin.js';

export class IntArgumentReader implements SubtagArgumentReader<number> {
    readonly #radix: number;

    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: IntArgumentReaderOptions) {
        this.name = name;
        this.maxSize = options.maxSize;
        this.#radix = options.radix;
    }

    public async * read(_name: string, arg: SubtagArgument, script: BBTagScript): InterruptableAsyncProcess<number> {
        const number = script.process.plugins.get(NumberPlugin);
        const text = yield* arg.value(this.maxSize);
        const result = number.parseInt(text, this.#radix);
        if (result === undefined)
            throw new NotANumberError(text);
        return result;
    }
}

export interface IntArgumentReaderOptions {
    readonly radix: number;
    readonly maxSize: number;
}
