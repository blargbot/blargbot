import type { BBTagScript } from '@bbtag/engine';
import { booleanResultAdapter, Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class IsCustomCommandSubtag extends Subtag {
    public constructor() {
        super({
            name: 'isCustomCommand',
            aliases: ['isCC']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.script)
        .convertResultUsing(booleanResultAdapter)
    public isCC(context: BBTagScript): boolean {
        return context.options.type === 'cc';
    }
}
