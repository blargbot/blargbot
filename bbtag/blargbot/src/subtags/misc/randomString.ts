import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class RandomStringSubtag extends Subtag {
    public constructor() {
        super({
            name: 'randomString',
            aliases: ['randStr', 'randString']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('chars'))
        .parameter(p.int('count').tryFallback())
    public randStr(
        chars: string,
        count: number
    ): string {
        if (chars.length === 0)
            throw new BBTagRuntimeError('Not enough characters');

        const numberArray = [...Array(count).keys()]; // TODO: count should be limited here
        return numberArray.map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
}
