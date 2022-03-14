import { DefinedSubtag } from '@blargbot/cluster/bbtag';
import { parse, SubtagType } from '@blargbot/cluster/utils';

export class ParseIntSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'parseint',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['number'],
                    description: 'Returns an integer from `text`. If it wasn\'t a number, returns `NaN`.',
                    exampleCode: '{parseint;abcd} {parseint;1234} {parseint;12cd}',
                    exampleOut: 'NaN 1234 12',
                    returns: 'number',
                    execute: (_, [number]) => this.parseInt(number.value)
                }
            ]
        });
    }

    public parseInt(number: string): number {
        return parse.int(number);
    }
}
