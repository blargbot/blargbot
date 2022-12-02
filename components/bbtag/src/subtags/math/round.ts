import { parse } from '@blargbot/core/utils/index.js';

import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.round;

export class RoundSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'round',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['number'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, [number]) => this.round(number.value)
                }
            ]
        });
    }

    public round(value: string): number {
        const number = parse.float(value);
        if (number === undefined)
            throw new NotANumberError(value);
        return Math.round(number);
    }
}
