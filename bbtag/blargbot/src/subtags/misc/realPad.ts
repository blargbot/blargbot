import { BBTagRuntimeError, NotANumberError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';
import { parse } from '@blargbot/core/utils/index.js';

import { p } from '../p.js';

export class RealPadSubtag extends Subtag {
    public constructor() {
        super({
            name: 'realPad',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', 'length'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text, length]) => this.realPad(text.value, length.value, ' ', 'right')
                },
                {
                    parameters: ['text', 'length', 'filler: ', 'direction?:right'],
                    description: tag.withDirection.description,
                    exampleCode: tag.withDirection.exampleCode,
                    exampleOut: tag.withDirection.exampleOut,
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
        const length = parse.int(lengthStr);
        if (length === undefined)
            throw new NotANumberError(lengthStr);

        if (filler === '')
            filler = ' ';
        if (filler.length !== 1)
            throw new BBTagRuntimeError('Filler must be 1 character');

        if (directionStr !== 'right' && directionStr !== 'left')
            throw new BBTagRuntimeError('Invalid direction', `${directionStr} is invalid`);
        const direction: 'right' | 'left' = directionStr;

        const padAmount = Math.max(0, length - text.length);

        if (direction === 'right')
            return text + filler.repeat(padAmount);
        return filler.repeat(padAmount) + text;
    }
}
