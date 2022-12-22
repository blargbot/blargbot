import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';

import type { SubtagParameter } from './SubtagParameter.js';

export class BBTagScriptGetterParameter<T> implements SubtagParameter<T, readonly []> {
    readonly #getter: (script: BBTagScript) => InterruptableProcess<T>;

    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly readers = [] as const;

    public constructor(getter: (script: BBTagScript) => InterruptableProcess<T>) {
        this.#getter = getter;
    }

    public aggregate(_name: string, _values: [], script: BBTagScript): InterruptableProcess<T> {
        return this.#getter(script);
    }
}
