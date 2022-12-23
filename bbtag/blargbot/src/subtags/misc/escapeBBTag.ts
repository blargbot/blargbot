import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class EscapeBBTagSubtag extends Subtag {
    public constructor() {
        super({
            name: 'escapeBBTag',
            aliases: ['escape']
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.raw('input').optional().repeat().flatMap(v => v.join(';')))
    public escape(text: string): string {
        return text;
    }
}
