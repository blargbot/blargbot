import type { BBTagScript } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class TagAuthorSubtag extends Subtag {
    public constructor() {
        super({
            name: 'tagAuthor',
            aliases: ['customCommandAuthor', 'ccAuthor']
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.script)
    public getAuthor(script: BBTagScript): string {
        return script.options.author;
    }
}
