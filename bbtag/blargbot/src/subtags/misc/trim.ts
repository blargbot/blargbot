import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class TrimSubtag extends Subtag {
    public constructor() {
        super({
            name: 'trim'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('text'))
    public trim(text: string): string {
        return text.trim();
    }
}
