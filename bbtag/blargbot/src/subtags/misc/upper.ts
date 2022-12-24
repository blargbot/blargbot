import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class UpperSubtag extends Subtag {
    public constructor() {
        super({
            name: 'upper'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('text'))
    public uppercase(text: string): string {
        return text.toUpperCase();
    }
}
