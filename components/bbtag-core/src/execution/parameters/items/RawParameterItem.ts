import type { InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import { processResult } from '../../../runtime/processResult.js';
import type { SubtagArgument } from '../../SubtagArgument.js';
import type { SubtagParameterItem as SubtagParameterItem } from '../../SubtagParameter.js';

export class RawParameterItem implements SubtagParameterItem<string> {
    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: RawParameterItemOptions) {
        this.name = name;
        this.maxSize = options.maxSize;
    }

    public getValue(_name: string, arg: SubtagArgument): InterruptableProcess<string> {
        return processResult(arg.template.source);
    }
}

export interface RawParameterItemOptions {
    readonly maxSize: number;
}
