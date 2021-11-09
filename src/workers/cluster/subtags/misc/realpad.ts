import { BaseSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class RealPadSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'realpad',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', 'length'],
                    description: 'Pads `text` using space until it has `length` characters. Spaces are added on the right side.',
                    exampleCode: '{realpad;Hello;10} world!',
                    exampleOut: 'Hello      world!',
                    execute: (_context, args) => this.realPad(args[0].value, args[1].value, ' ', 'right')
                },
                {
                    parameters: ['text', 'length', 'filler', 'direction?:right'],
                    description: 'Pads `text` using `filler` until it has `length` characters. `filler` is applied to the  `direction` of `text`. `filler` defaults to space.',
                    exampleCode: '{realpad;ABC;6;0;left}',
                    exampleOut: '000ABC',
                    execute: (_context, args) => this.realPad(args[0].value, args[1].value, args[2].value, args[3].value.toLowerCase())
                }
            ]
        });
    }

    public realPad(
        text: string,
        lengthStr: string,
        filler: string,
        directionStr: string
    ): string {
        const length = parse.int(lengthStr, false);
        if (filler === '')
            filler = ' ';
        if (directionStr !== 'right' && directionStr !== 'left')
            throw new BBTagRuntimeError('Invalid direction', directionStr + 'is invalid');
        const direction: 'right' | 'left' = directionStr;

        if (length === undefined)
            throw new NotANumberError(lengthStr);

        if (filler.length !== 1)
            throw new BBTagRuntimeError('Filler must be 1 character');

        const padAmount = Math.max(0, length - text.length);

        if (direction === 'right')
            return text + filler.repeat(padAmount);
        return filler.repeat(padAmount) + text;
    }
}
