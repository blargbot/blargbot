import { DefinedSubtag } from '@blargbot/cluster/bbtag';
import { NotANumberError } from '@blargbot/cluster/bbtag/errors';
import { parse, SubtagType } from '@blargbot/cluster/utils';

export class RoundSubtag extends DefinedSubtag {
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
                    returns: 'number',
                    execute: (_, [number]) => this.round(number.value)
                }
            ]
        });
    }

    public round(value: string): number {
        const number = parse.float(value, false);
        if (number === undefined)
            throw new NotANumberError(value);
        return Math.round(number);
    }
}
