import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class VoidSubtag extends Subtag {
    public constructor() {
        super({
            name: 'void',
            aliases: ['null']
        });
    }

    @Subtag.signature({ id: 'default', returns: 'void' })
        .parameter(p.string('code').repeat())
    public returnNothing(): void {
        /*NOOP*/
    }
}
