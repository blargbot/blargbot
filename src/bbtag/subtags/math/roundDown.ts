import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation/index';
import { NotANumberError } from '../../errors/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.roundDown;

export class RoundDownSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'roundDown',
            category: SubtagType.MATH,
            aliases: ['floor'],
            definition: [
                {
                    parameters: ['number'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, [number]) => this.rounddown(number.value)
                }
            ]
        });
    }

    public rounddown(value: string): number {
        const number = parse.float(value);
        if (number === undefined)
            throw new NotANumberError(value);
        return Math.floor(number);
    }
}
