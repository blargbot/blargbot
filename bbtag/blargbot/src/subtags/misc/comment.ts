import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class CommentSubtag extends Subtag {
    public constructor() {
        super({
            name: 'comment',
            aliases: ['//']
        });
    }

    @Subtag.signature({ id: 'default', returns: 'void' })
        .parameter(p.raw('anything').optional().repeat())
    public doNothing(): void {
        /*NOOP*/
    }
}
