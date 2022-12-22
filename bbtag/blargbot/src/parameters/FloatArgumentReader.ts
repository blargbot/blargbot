import type { BBTagScript, InterruptableAsyncProcess } from '@bbtag/engine';
import type { SubtagArgument, SubtagArgumentReader } from '@bbtag/subtag';

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
        return number.parseFloat(yield* arg.value(this.maxSize));
    }
}

export interface FloatArgumentReaderOptions {
    readonly maxSize: number;
}
