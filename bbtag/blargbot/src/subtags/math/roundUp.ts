import { parse } from '@blargbot/core/utils/index.js';

import { NotANumberError } from '@bbtag/engine';
import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';

export class RoundUpSubtag extends Subtag {
    public constructor() {
        super({
            name: 'roundUp',
            category: SubtagType.MATH,
            aliases: ['ceil'],
            definition: [
                {
                    parameters: ['number'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, [number]) => this.roundup(number.value)
                }
            ]
        });
    }

    public roundup(value: string): number {
        const number = parse.float(value);
        if (number === undefined)
            throw new NotANumberError(value);
        return Math.ceil(number);
    }
}
