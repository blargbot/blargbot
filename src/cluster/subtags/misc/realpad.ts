import { DefinedSubtag } from '@blargbot/cluster/bbtag';
import { BBTagRuntimeError, NotANumberError } from '@blargbot/cluster/bbtag/errors';
import { parse, SubtagType } from '@blargbot/cluster/utils';

export class RealPadSubtag extends DefinedSubtag {
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
                    returns: 'string',
                    execute: (_, [text, length]) => this.realPad(text.value, length.value, ' ', 'right')
                },
                {
                    parameters: ['text', 'length', 'filler', 'direction?:right'],
                    description: 'Pads `text` using `filler` until it has `length` characters. `filler` is applied to the  `direction` of `text`. `filler` defaults to space.',
                    exampleCode: '{realpad;ABC;6;0;left}',
                    exampleOut: '000ABC',
                    returns: 'string',
                    execute: (_, [text, length, filler, direction]) => this.realPad(text.value, length.value, filler.value, direction.value.toLowerCase())
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
        if (length === undefined)
            throw new NotANumberError(lengthStr);

        if (filler === '')
            filler = ' ';
        if (filler.length !== 1)
            throw new BBTagRuntimeError('Filler must be 1 character');

        if (directionStr !== 'right' && directionStr !== 'left')
            throw new BBTagRuntimeError('Invalid direction', directionStr + ' is invalid');
        const direction: 'right' | 'left' = directionStr;

        const padAmount = Math.max(0, length - text.length);

        if (direction === 'right')
            return text + filler.repeat(padAmount);
        return filler.repeat(padAmount) + text;
    }
}
