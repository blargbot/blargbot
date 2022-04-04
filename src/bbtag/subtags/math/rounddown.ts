import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import { NotANumberError } from '../../errors';
import { SubtagType } from '../../utils';

export class RoundDownSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rounddown',
            category: SubtagType.MATH,
            aliases: ['floor'],
            definition: [
                {
                    parameters: ['number'],
                    description: 'Rounds `number` down.',
                    exampleCode: '{rounddown;1.23}',
                    exampleOut: '1',
                    returns: 'number',
                    execute: (_, [number]) => this.rounddown(number.value)
                }
            ]
        });
    }

    public rounddown(value: string): number {
        const number = parse.float(value, false);
        if (number === undefined)
            throw new NotANumberError(value);
        return Math.floor(number);
    }
}
