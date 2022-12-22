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

    @Subtag.signature(p.script).returns('boolean')
    public isCC(context: BBTagScript): boolean {
        return context.options.type === 'cc';
    }
}
