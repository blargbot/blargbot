import { NumberPlugin } from '../../../plugins/NumberPlugin.js';
import type { BBTagScript } from '../../../runtime/BBTagScript.js';
import type { InterruptableAsyncProcess } from '../../../runtime/InterruptableProcess.js';
import type { SubtagArgument } from '../../SubtagArgument.js';
import type { SubtagParameterItem as SubtagParameterItem } from '../../SubtagParameter.js';

export class FloatParameterItem implements SubtagParameterItem<number> {
    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: FloatParameterItemOptions) {
        this.name = name;
        this.maxSize = options.maxSize;
    }

    public async *getValue(_name: string, arg: SubtagArgument, script: BBTagScript): InterruptableAsyncProcess<number> {
        const number = script.process.plugins.get(NumberPlugin);
        return number.parseFloat(yield* arg.value());
    }
}

export interface FloatParameterItemOptions {
    readonly maxSize: number;
}
