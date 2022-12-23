import type { BBTagScript, InterruptableAsyncProcess } from '@bbtag/engine';
import type { SubtagArgument, SubtagArgumentReader } from '@bbtag/subtag';

import { NotANumberError } from '../index.js';
import { NumberPlugin } from '../plugins/NumberPlugin.js';

export class FloatArgumentReader implements SubtagArgumentReader<number> {
    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: FloatArgumentReaderOptions) {
        this.name = name;
        this.maxSize = options.maxSize;
    }

    public async * read(_name: string, arg: SubtagArgument, script: BBTagScript): InterruptableAsyncProcess<number> {
        const number = script.process.plugins.get(NumberPlugin);
        const text = yield* arg.value(this.maxSize);
        const result = number.parseFloat(text);
        if (result === undefined)
            throw new NotANumberError(text);
        return result;
    }
}

export interface FloatArgumentReaderOptions {
    readonly maxSize: number;
}
