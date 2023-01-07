import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class RealPadSubtag extends Subtag {
    public constructor() {
        super({
            name: 'realPad'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('text'))
        .parameter(p.int('length'))
        .parameter(p.const(' '))
        .parameter(p.const('right'))
    @Subtag.signature({ id: 'withDirection' })
        .parameter(p.string('text'))
        .parameter(p.int('length'))
        .parameter(p.string('filler').default(' '))
        .parameter(p.string('direction').optional('right'))
    public realPad(
        text: string,
        length: number,
        filler: string,
        directionStr: string
    ): string {
        if (filler.length !== 1)
            throw new BBTagRuntimeError('Filler must be 1 character');

        const padAmount = Math.max(0, length - text.length);

        switch (directionStr.toLowerCase()) {
            case 'right': return text + filler.repeat(padAmount);
            case 'left': return filler.repeat(padAmount) + text;
            default: throw new BBTagRuntimeError('Invalid direction', `${directionStr} is invalid`);
        }
    }
}
