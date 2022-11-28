import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import { NotANumberError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.roundUp;

export class RoundUpSubtag extends CompiledSubtag {
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
