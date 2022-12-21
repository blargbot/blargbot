import type { BBTagScript } from '../../runtime/BBTagScript.js';
import type { InterruptableProcess } from '../../runtime/InterruptableProcess.js';
import type { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagParameter } from '../SubtagParameter.js';

export class BBTagScriptGetterParameter<T> implements SubtagParameter<T> {
    readonly #getter: (script: BBTagScript) => InterruptableProcess<T>;

    public readonly minRepeat = 0;
    public readonly maxRepeat = 0;
    public readonly values = [];

    public constructor(getter: (script: BBTagScript) => InterruptableProcess<T>) {
        this.#getter = getter;
    }

    public getValue(_name: string, _values: SubtagArgument[], script: BBTagScript): InterruptableProcess<T> {
        return this.#getter(script);
    }
}
