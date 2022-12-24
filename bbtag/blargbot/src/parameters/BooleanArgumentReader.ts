import type { BBTagScript, InterruptableAsyncProcess } from '@bbtag/engine';
import type { SubtagArgument, SubtagArgumentReader } from '@bbtag/subtag';

import { NotABooleanError } from '../errors/NotABooleanError.js';
import { BooleanPlugin } from '../plugins/BooleanPlugin.js';

export class BooleanArgumentReader implements SubtagArgumentReader<boolean> {
    readonly #allowNumbers: boolean;

    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: BooleanArgumentReaderOptions) {
        this.name = name;
        this.maxSize = options.maxSize;
        this.#allowNumbers = options.allowNumbers;
    }

    public async * read(_name: string, arg: SubtagArgument, script: BBTagScript): InterruptableAsyncProcess<boolean> {
        const boolean = script.process.plugins.get(BooleanPlugin);
        const text = yield* arg.value(this.maxSize);
        const result = boolean.parseBoolean(text, { allowNumbers: this.#allowNumbers });
        if (result === undefined)
            throw new NotABooleanError(text);
        return result;
    }
}

export interface BooleanArgumentReaderOptions {
    readonly maxSize: number;
    readonly allowNumbers: boolean;
}
