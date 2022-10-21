import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import { NotANumberError } from '../../errors';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.abs;

export class AbsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'abs',
            category: SubtagType.MATH,
            aliases: ['absolute'],
            definition: [
                {
                    parameters: ['number'],
                    description: 'Gets the absolute value of `number`',
                    exampleCode: '{abs;-535}',
                    exampleOut: '535',
                    returns: 'number|number[]',
                    execute: (_, [value]) => this.absSingle(value.value)
                },
                {
                    parameters: ['numbers+2'],
                    description: 'Gets the absolute value of each `numbers` and returns an array containing the results',
                    exampleCode: '{abs;-535;123;-42}',
                    exampleOut: '[535, 123, 42]',
                    returns: 'number[]',
                    execute: (_, values) => this.absMultiple(values.map(arg => arg.value))
                }
            ]
        });
    }

    public absSingle(value: string): number | number[] {
        const result = this.absMultiple([value]);
        if (result.length === 1)
            return result[0];
        return result;
    }

    public absMultiple(values: string[]): number[] {
        return bbtag.tagArray.flattenArray(values)
            .map(s => {
                switch (typeof s) {
                    case 'string': {
                        const result = parse.float(s);
                        if (result === undefined)
                            throw new NotANumberError(s);
                        return result;
                    }
                    case 'number':
                    case 'bigint':
                        return s;
                    default:
                        throw new NotANumberError(s);
                }
            })
            .map(Math.abs);
    }

}
