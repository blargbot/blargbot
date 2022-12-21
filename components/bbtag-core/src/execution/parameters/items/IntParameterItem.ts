import { NumberPlugin } from '../../../plugins/NumberPlugin.js';
import type { BBTagScript } from '../../../runtime/BBTagScript.js';
import type { InterruptableAsyncProcess } from '../../../runtime/InterruptableProcess.js';
import type { SubtagArgument } from '../../SubtagArgument.js';
import type { SubtagParameterItem as SubtagParameterItem } from '../../SubtagParameter.js';

export class IntParameterItem implements SubtagParameterItem<number> {
    readonly #radix: number;

    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: IntParameterItemOptions) {
        this.name = name;
        this.maxSize = options.maxSize;
        this.#radix = options.radix;
    }

    public async *getValue(_name: string, arg: SubtagArgument, script: BBTagScript): InterruptableAsyncProcess<number> {
        const number = script.process.plugins.get(NumberPlugin);
        return number.parseInt(yield* arg.value(), this.#radix);
    }
}

export interface IntParameterItemOptions {
    readonly radix: number;
    readonly maxSize: number;
}
