import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class SubstringSubtag extends Subtag {
    public constructor() {
        super({
            name: 'substring'
        });
    }

    @Subtag.signature(
        p.string('text'),
        p.int('start').fallback(),
        p.int('end').fallback().optional().ignoreEmpty()
    ).returns('string')
    public substring(text: string, start: number, end = text.length): string {
        return text.substring(start, end);
    }
}
