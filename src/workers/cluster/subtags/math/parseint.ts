import { Subtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class ParseIntSubtag extends Subtag {
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
                    execute: (_, [{ value: text }]) => {
                        const number = parse.int(text);
                        if (isNaN(number))
                            return 'NaN';
                        return number.toString();
                    }
                }
            ]
        });
    }
}
