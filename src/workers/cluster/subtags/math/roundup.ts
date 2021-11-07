import { BaseSubtag } from '@cluster/bbtag';
import { NotAnArrayError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class RoundUpSubtag extends BaseSubtag {
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
                    execute: (_, [{ value: numberStr }]) => {
                        const number = parse.float(numberStr, false);
                        if (number === undefined)
                            throw new NotAnArrayError(numberStr);
                        return Math.ceil(number).toString();
                    }
                }
            ]
        });
    }
}
