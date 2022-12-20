import { UnknownSubtagError } from '../index.js';
import type { BBTagSubtagCall } from '../language/BBTagSubtagCall.js';
import type { BBTagScript } from '../runtime/BBTagScript.js';
import type { InterruptableProcess } from '../runtime/InterruptableProcess.js';
import type { SubtagEvaluator } from './SubtagEvaluator.js';

export class CompositeSubtagEvaluator implements SubtagEvaluator {
    readonly #implementations: Map<string, SubtagEvaluator>;
    readonly #getKeys: (name: string) => Iterable<string>;

    public constructor(implementations: Map<string, SubtagEvaluator>, getKeys: (name: string) => Iterable<string>) {
        this.#implementations = implementations;
        this.#getKeys = getKeys;
    }

    public execute(name: string, call: BBTagSubtagCall, script: BBTagScript): InterruptableProcess<string> {
        for (const key of this.#getKeys(name)) {
            const implementation = this.#implementations.get(key);
            if (implementation !== undefined)
                return implementation.execute(name, call, script);
        }

        throw new UnknownSubtagError(name);
    }
}
