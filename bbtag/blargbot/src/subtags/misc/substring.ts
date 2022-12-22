import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class SubstringSubtag extends Subtag {
    public constructor() {
        super({
            name: 'substring'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.string('text'))
        .parameter(p.int('start').fallback())
        .parameter(p.int('end').fallback().optional().ignoreEmpty())
    public substring(text: string, start: number, end = text.length): string {
        return text.substring(start, end);
    }
}
