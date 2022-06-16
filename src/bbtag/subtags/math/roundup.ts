import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import { NotANumberError } from '../../errors';
import { SubtagType } from '../../utils';

export class RoundUpSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'roundup',
            category: SubtagType.MATH,
            aliases: ['ceil'],
            definition: [
                {
                    parameters: ['number'],
                    description: 'Rounds `number` up.',
                    exampleCode: '{roundup;1.23}',
                    exampleOut: '2',
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
