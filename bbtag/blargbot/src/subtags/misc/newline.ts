import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class NewlineSubtag extends Subtag {
    public constructor() {
        super({
            name: 'newline',
            aliases: ['n']
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.int('count').tryFallback().optional(1))
    public getNewlines(count: number): string {
        // TODO: limit count
        return '\n'.repeat(count);
    }
}
