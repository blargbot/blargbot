import type { BBTagScript, InterruptableAsyncProcess, InterruptableProcess } from '@bbtag/engine';

import type { SubtagArgumentReader } from '../index.js';
import type { SubtagParameterDetails } from './SubtagParameter.js';
import { SubtagParameter } from './SubtagParameter.js';

export class BBTagParameterTransform<Source, Dest, Args extends readonly unknown[]> extends SubtagParameter<Awaited<Dest>, Args> {
    readonly #source: SubtagParameterDetails<Source, Args>;
    readonly #mapping: (source: Source, script: BBTagScript) => InterruptableProcess<Dest>;

    public get minRepeat(): number {
        return this.#source.minRepeat;
    }

    public get maxRepeat(): number {
        return this.#source.maxRepeat;
    }

    public get readers(): { [P in keyof Args]: SubtagArgumentReader<Args[P]>; } {
        return this.#source.readers;
    }

    public constructor(source: SubtagParameterDetails<Source, Args>, mapping: (source: Source, script: BBTagScript) => InterruptableProcess<Dest>) {
        super();
        this.#source = source;
        this.#mapping = mapping;
    }

    public async *aggregate(name: string, values: Array<[...Args]>, script: BBTagScript): InterruptableAsyncProcess<Awaited<Dest>> {
        const source = yield* this.#source.aggregate(name, values, script);
        return yield* this.#mapping(source, script);
    }
}
