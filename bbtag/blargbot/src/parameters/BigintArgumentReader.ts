import type { BBTagScript, InterruptableAsyncProcess } from '@bbtag/engine';
import type { SubtagArgument, SubtagArgumentReader } from '@bbtag/subtag';

import { NotANumberError } from '../errors/NotANumberError.js';
import { NumberPlugin } from '../plugins/NumberPlugin.js';

export class BigintArgumentReader implements SubtagArgumentReader<bigint> {
    public readonly reader = this;
    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: BigintArgumentReaderOptions) {
        this.name = name;
        this.maxSize = options.maxSize;
    }

    public async * read(_name: string, arg: SubtagArgument, script: BBTagScript): InterruptableAsyncProcess<bigint> {
        const number = script.process.plugins.get(NumberPlugin);
        const text = yield* arg.value(this.maxSize);
        const result = number.parseBigint(text);
        if (result === undefined)
            throw new NotANumberError(text);
        return result;
    }
}

export interface BigintArgumentReaderOptions {
    readonly maxSize: number;
}
