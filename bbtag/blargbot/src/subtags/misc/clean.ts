import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class CleanSubtag extends Subtag {
    public constructor() {
        super({
            name: 'clean'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('text'))
    public clean(text: string): string {
        return text.replace(/\s+/g, (match) => {
            if (match.includes('\n')) return '\n';
            if (match.includes('\t')) return '\t';
            return match[0];
        });
    }
}
