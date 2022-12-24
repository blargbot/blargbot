import { arrayResultAdapter, Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class RegexSplitSubtag extends Subtag {
    public constructor() {
        super({
            name: 'regexSplit'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('text'))
        .parameter(p.regex('regex', { maxSize: 50000 }))
        .useConversion(arrayResultAdapter)
    public regexSplit(text: string, regex: RegExp): string[] {
        return text.split(regex);
    }
}
