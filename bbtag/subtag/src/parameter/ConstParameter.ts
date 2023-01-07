import type { InterruptableProcess } from '@bbtag/engine';
import { } from '@bbtag/engine';

import type { SubtagParameterDetails } from './SubtagParameter.js';

export class ConstParameter<T> implements SubtagParameterDetails<T, readonly []> {
    readonly #value: T;

    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly readers = [] as const;

    public constructor(value: T) {
        this.#value = value;
    }

    public * aggregate(): InterruptableProcess<T> {
        return this.#value;
    }
}
