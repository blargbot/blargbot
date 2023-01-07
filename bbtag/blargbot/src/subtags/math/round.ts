import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class RoundSubtag extends Subtag {
    public constructor() {
        super({
            name: 'round'
        });
    }

    @Subtag.signature(p.float('number')).convertResultUsing('number')
    public round(number: number): number {
        return Math.round(number);
    }
}
