import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

import type { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagArgumentReader as SubtagArgumentReader, SubtagArgumentReaderProvider } from './SubtagArgumentReader.js';

export class EmptyArgumentReader<T, R> implements SubtagArgumentReader<T | R> {
    readonly #source: SubtagArgumentReader<T>;
    readonly #fallback: () => R;

    public readonly reader = this;
    public get name(): string {
        return this.#source.name;
    }
    public get maxSize(): number {
        return this.#source.maxSize;
    }

    public constructor(source: SubtagArgumentReaderProvider<T>, fallback: () => R) {
        this.#source = source.reader;
        this.#fallback = fallback;
    }

    public async *read(name: string, arg: SubtagArgument, script: BBTagScript): InterruptableProcess<T | R> {
        const text = yield* arg.value(this.maxSize);
        if (text.length === 0)
            return this.#fallback();
        return yield* this.#source.read(name, arg, script);
    }
}
