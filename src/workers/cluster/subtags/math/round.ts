import { Subtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class RoundSubtag extends Subtag {
    public constructor() {
        super({
            name: 'round',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['number'],
                    description: 'Rounds `number` to the nearest whole number.',
                    exampleCode: '{round;1.23}',
                    exampleOut: '1',
                    execute: (_, [{ value: numberStr }]) => {
                        const number = parse.float(numberStr, false);
                        if (number === undefined)
                            throw new NotANumberError(numberStr);
                        return Math.round(number).toString();
                    }
                }
            ]
        });
    }
}
