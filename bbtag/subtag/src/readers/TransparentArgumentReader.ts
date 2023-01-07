import type { InterruptableProcess } from '@bbtag/engine';

import type { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagArgumentReader as SubtagArgumentReader } from './SubtagArgumentReader.js';

export class TransparentArgumentReader implements SubtagArgumentReader<SubtagArgument> {
    public readonly reader = this;
    public readonly name: string;
    public readonly maxSize = Infinity;

    public constructor(name: string) {
        this.name = name;
    }

    public * read(_name: string, arg: SubtagArgument): InterruptableProcess<SubtagArgument> {
        return arg;
    }
}
