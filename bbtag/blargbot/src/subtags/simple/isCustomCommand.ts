import type { BBTagScript } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class IsCustomCommandSubtag extends Subtag {
    public constructor() {
        super({
            name: 'isCustomCommand',
            aliases: ['isCC']
        });
    }

    @Subtag.signature({ id: 'default', returns: 'boolean' })
        .parameter(p.script)
    public isCC(context: BBTagScript): boolean {
        return context.options.type === 'cc';
    }
}
