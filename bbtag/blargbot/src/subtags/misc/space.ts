import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class SpaceSubtag extends Subtag {
    public constructor() {
        super({
            name: 'space',
            aliases: ['s']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.int('count').tryFallback().optional(1))
    public getSpaces(count: number): string {
        // TODO: limit count
        return ' '.repeat(count);
    }
}
