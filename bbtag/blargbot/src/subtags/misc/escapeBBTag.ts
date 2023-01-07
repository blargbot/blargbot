import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class EscapeBBTagSubtag extends Subtag {
    public constructor() {
        super({
            name: 'escapeBBTag',
            aliases: ['escape']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.raw('input').repeat(0).map(v => v.join(';')))
    public escape(text: string): string {
        return text;
    }
}
