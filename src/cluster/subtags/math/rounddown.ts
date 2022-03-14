import { DefinedSubtag } from '@blargbot/cluster/bbtag';
import { NotANumberError } from '@blargbot/cluster/bbtag/errors';
import { parse, SubtagType } from '@blargbot/cluster/utils';

export class RoundDownSubtag extends DefinedSubtag {
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
