import { BaseSubtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class RoundDownSubtag extends BaseSubtag {
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
                    execute: (_, [{ value: numberStr }]) => {
                        const number = parse.float(numberStr, false);
                        if (number === undefined)
                            throw new NotANumberError(numberStr);
                        return Math.floor(number).toString();
                    }
                }
            ]
        });
    }
}
