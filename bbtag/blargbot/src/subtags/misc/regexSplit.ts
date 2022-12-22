import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class RegexSplitSubtag extends Subtag {
    public constructor() {
        super({
            name: 'regexSplit'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string[]' })
        .parameter(p.string('text'))
        .parameter(p.regex('regex', { maxSize: 50000 }))
    public regexSplit(text: string, regex: RegExp): string[] {
        return text.split(regex);
    }
}
