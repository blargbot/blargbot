import { DefinedSubtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

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
                    returns: 'number',
                    execute: (_, [value]) => this.abs(value.value)
                },
                {
                    parameters: ['numbers+2'],
                    description: 'Gets the absolute value of each `numbers` and returns an array containing the results',
                    exampleCode: '{abs;-535;123;-42}',
                    exampleOut: '[535, 123, 42]',
                    returns: 'number[]',
                    execute: (_, values) => this.absAll(values.map(arg => arg.value))
                }
            ]
        });
    }

    public absAll(values: string[]): number[] {
        const result = [];
        for (const value of values) {
            const parsed = parse.float(value, false);
            if (parsed === undefined)
                throw new NotANumberError(value);
            result.push(Math.abs(parsed));
        }
        return result;
    }

    public abs(value: string): number {
        const val = parse.float(value, false);
        if (val === undefined)
            throw new NotANumberError(value);
        return Math.abs(val);
    }
}
