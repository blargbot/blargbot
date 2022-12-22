import type { BBTagScript, InterruptableAsyncProcess } from '@bbtag/engine';
import type { SubtagArgument, SubtagArgumentReader } from '@bbtag/subtag';

import { NotAnArrayError } from '../errors/NotAnArrayError.js';
import type { BBTagArrayRef } from '../index.js';
import { ArrayPlugin } from '../index.js';
import { VariablesPlugin } from '../plugins/VariablesPlugin.js';

export class ArrayArgumentReader implements SubtagArgumentReader<BBTagArrayRef> {
    readonly #allowVarName: boolean;

    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: ArrayArgumentReaderOptions) {
        this.name = name;
        this.maxSize = options.maxSize;
        this.#allowVarName = options.allowVarName;
    }

    public async * read(_name: string, arg: SubtagArgument, script: BBTagScript): InterruptableAsyncProcess<BBTagArrayRef> {
        const array = script.process.plugins.get(ArrayPlugin);
        const value = yield* arg.value(this.maxSize);
        const result = array.tryParseArray(value);
        if (result !== undefined)
            return result;

        if (!this.#allowVarName)
            throw new NotAnArrayError(value);

        const variables = script.process.plugins.get(VariablesPlugin);
        const dbValue = await variables.get(value);
        if (Array.isArray(dbValue))
            return { n: value, v: dbValue };

        throw new NotAnArrayError(value);
    }
}

export interface ArrayArgumentReaderOptions {
    readonly allowVarName: boolean;
    readonly maxSize: number;
}
