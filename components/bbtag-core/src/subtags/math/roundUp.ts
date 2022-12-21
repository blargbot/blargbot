import { parse } from '@blargbot/core/utils/index.js';

import { NotANumberError } from '../../errors/index.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

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
