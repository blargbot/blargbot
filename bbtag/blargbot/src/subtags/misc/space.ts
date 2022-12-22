import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class SpaceSubtag extends Subtag {
    public constructor() {
        super({
            name: 'space',
            aliases: ['s']
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.int('count').fallback().optional(1).ignoreEmpty())
    public getSpaces(count: number): string {
        // TODO: limit count
        return ' '.repeat(count);
    }
}
