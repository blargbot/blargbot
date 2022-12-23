import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class LowerSubtag extends Subtag {
    public constructor() {
        super({
            name: 'lower'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.string('text'))
    public lowercase(value: string): string {
        return value.toLowerCase();
    }
}
