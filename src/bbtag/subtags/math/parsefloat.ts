import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.parsefloat;

export class ParseFloatSubtag extends CompiledSubtag {
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
        return parse.float(number) ?? NaN;
    }
}
