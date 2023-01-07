import type { BBTagScript, InterruptableProcess } from '@bbtag/engine';
import { ArgumentLengthError } from '@bbtag/engine';
import type { SubtagArgument, SubtagArgumentReader } from '@bbtag/subtag';

import { RegexPlugin } from '../plugins/RegexPlugin.js';

export class RegexArgumentReader implements SubtagArgumentReader<RegExp> {
    public readonly reader = this;
    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: RegexArgumentReaderOptions) {
        this.name = name;
        this.maxSize = options.maxSize;
    }

    public * read(_name: string, arg: SubtagArgument, script: BBTagScript): InterruptableProcess<RegExp> {
        const parser = script.process.plugins.get(RegexPlugin);
        const text = arg.template.source;
        if (text.length > this.maxSize)
            throw new ArgumentLengthError(arg.index, this.maxSize, text.length);
        return parser.createRegex(text);
    }
}

export interface RegexArgumentReaderOptions {
    readonly maxSize: number;
}
