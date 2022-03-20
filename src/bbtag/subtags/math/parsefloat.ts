import { parse } from '@blargbot/core/utils';

import { DefinedSubtag } from '../../DefinedSubtag';
import { SubtagType } from '../../utils';

export class ParseFloatSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'parsefloat',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['number'],
                    description: 'Returns an floating point number from `text`. If it wasn\'t a number, returns `NaN`.',
                    exampleCode: '{parsefloat;abcd} {parsefloat;12.34} {parsefloat;1.2cd}',
                    exampleOut: 'NaN 12.34 1.2',
                    returns: 'number',
                    execute: (_, [number]) => this.parseFloat(number.value)
                }
            ]
        });
    }

    public parseFloat(number: string): number {
        return parse.float(number);
    }
}
