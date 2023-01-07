import type { InterruptableProcess } from '@bbtag/engine';

import type { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagArgumentReader as SubtagArgumentReader } from './SubtagArgumentReader.js';

export class RawArgumentReader implements SubtagArgumentReader<string> {
    public readonly reader = this;
    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: RawParameterItemOptions) {
        this.name = name;
        this.maxSize = options.maxSize;
    }

    public *read(_name: string, arg: SubtagArgument): InterruptableProcess<string> {
        return arg.template.source;
    }
}

export interface RawParameterItemOptions {
    readonly maxSize: number;
}
