import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class ParseIntSubtag extends CompiledSubtag {
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
