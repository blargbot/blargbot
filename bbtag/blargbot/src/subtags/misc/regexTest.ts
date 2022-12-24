import { booleanResultAdapter, Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class RegexTestSubtag extends Subtag {
    public constructor() {
        super({
            name: 'regexTest'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('text'))
        .parameter(p.regex('regex', { maxSize: 50000 }))
        .useConversion(booleanResultAdapter)
    public regexTest(text: string, regex: RegExp): boolean {
        return regex.test(text);
    }
}
