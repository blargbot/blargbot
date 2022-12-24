import { arrayResultAdapter, Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class RegexMatchSubtag extends Subtag {
    public constructor() {
        super({
            name: 'regexMatch',
            aliases: ['match']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('text'))
        .parameter(p.regex('regex', { maxSize: 50000 }))
        .useConversion(arrayResultAdapter)
    public regexMatch(text: string, regex: RegExp): string[] {
        const matches = text.match(regex);
        return matches ?? [];
    }
}
