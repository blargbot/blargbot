import { emptyResultAdapter, Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class CommentSubtag extends Subtag {
    public constructor() {
        super({
            name: 'comment',
            aliases: ['//']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.raw('anything').optional().repeat())
        .useConversion(emptyResultAdapter)
    public doNothing(): void {
        /*NOOP*/
    }
}
