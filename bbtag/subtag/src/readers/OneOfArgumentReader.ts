import type { InterruptableAsyncProcess } from '@bbtag/engine';
import { BBTagRuntimeError } from '@bbtag/engine';

import type { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagArgumentReader as SubtagArgumentReader } from './SubtagArgumentReader.js';

export class OneOfArgumentReader<T extends readonly string[]> implements SubtagArgumentReader<T[number]> {
    readonly #test: (value: string) => T[number] | undefined;
    readonly #error: (value: string) => BBTagRuntimeError;

    public readonly reader = this;
    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, choices: T, error: string | ((value: string) => BBTagRuntimeError), options: OneOfArgumentReaderOptions) {
        this.name = name;
        this.maxSize = options.maxSize;
        this.#error = typeof error === 'string' ? () => new BBTagRuntimeError(error) : error;
        if (options.caseSensitive) {
            const allowed = new Set(choices);
            this.#test = v => allowed.has(v) ? v : undefined;
        } else {
            const map = new Map(choices.map((c: T[number]) => [c.toLowerCase() as string, c]));
            this.#test = v => map.get(v.toLowerCase());
        }
    }

    public async * read(_name: string, arg: SubtagArgument): InterruptableAsyncProcess<T[number]> {
        const value = yield* arg.value(this.maxSize);
        const result = this.#test(value);
        if (result === undefined)
            throw this.#error(value);
        return result;
    }
}

export interface OneOfArgumentReaderOptions {
    readonly maxSize: number;
    readonly caseSensitive: boolean;
}
