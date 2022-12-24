import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class CapitalizeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'capitalize'
        });
    }

    @Subtag.signature({ id: 'ignoreRest' })
        .parameter(p.string('text'))
        .parameter(p.const(false))
    @Subtag.signature({ id: 'restLower' })
        .parameter(p.string('text'))
        .parameter(p.string('lower').map(() => true))
    public capitalize(text: string, lowercase: boolean): string {
        const rest = text.slice(1);
        return text.slice(0, 1).toUpperCase() + (lowercase ? rest.toLowerCase() : rest);
    }
}
