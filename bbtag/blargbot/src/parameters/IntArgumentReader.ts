import type { BBTagScript, InterruptableAsyncProcess } from '@bbtag/engine';
import type { SubtagArgument, SubtagArgumentReader } from '@bbtag/subtag';

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
        return number.parseInt(yield* arg.value(), this.#radix);
    }
}

export interface IntArgumentReaderOptions {
    readonly radix: number;
    readonly maxSize: number;
}
