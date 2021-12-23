import { DefinedSubtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class AbsSubtag extends DefinedSubtag {
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
        return bbtagUtil.tagArray.flattenArray(values)
            .map(s => {
                switch (typeof s) {
                    case 'string': {
                        const result = parse.float(s, false);
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
