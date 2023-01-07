import type { BBTagScript, InterruptableAsyncProcess } from '@bbtag/engine';
import { BBTagRuntimeError } from '@bbtag/engine';

import { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagArgumentReader as SubtagArgumentReader, SubtagArgumentReaderProvider } from './SubtagArgumentReader.js';

export class FallbackAttemptingArgumentReader<T> implements SubtagArgumentReader<T> {
    readonly #source: SubtagArgumentReader<T>;

    public readonly reader = this;
    public get name(): string {
        return this.#source.name;
    }
    public get maxSize(): number {
        return this.#source.maxSize;
    }

    public constructor(source: SubtagArgumentReaderProvider<T>) {
        this.#source = source.reader;
    }

    public async *read(name: string, arg: SubtagArgument, script: BBTagScript): InterruptableAsyncProcess<T> {
        let error;
        try {
            return yield* this.#source.read(name, arg, script);
        } catch (err) {
            if (!(err instanceof BBTagRuntimeError))
                throw err;
            error = err;
        }

        const fallback = script.currentClosure.fallback;
        if (fallback === undefined)
            throw error;

        try {
            arg = new SubtagArgument(script, arg.index, {
                ...arg.template,
                source: fallback,
                statements: [fallback]
            });
            return yield* this.#source.read(name, arg, script);
        } catch {
            throw error;
        }

    }
}
