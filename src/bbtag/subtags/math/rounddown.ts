import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import { NotANumberError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.rounddown;

export class RoundDownSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rounddown',
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
