import { BaseSubtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class AbsSubtag extends BaseSubtag {
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
                    execute: (_, [value]) => this.abs(value.value)
                },
                {
                    parameters: ['numbers+2'],
                    description: 'Gets the absolute value of each `numbers` and returns an array containing the results',
                    exampleCode: '{abs;-535;123;-42}',
                    exampleOut: '[535, 123, 42]',
                    execute: (_, args) => this.absAll(args.map(arg => arg.value))
                }
            ]
        });
    }

    public absAll(values: string[]): string {
        const result = [];
        for (const value of values) {
            const parsed = parse.float(value, false);
            if (parsed === undefined)
                throw new NotANumberError(value);
            result.push(Math.abs(parsed));
        }
        return bbtagUtil.tagArray.serialize(result);
    }

    public abs(value: string): string {
        const val = parse.float(value, false);
        if (val === undefined)
            throw new NotANumberError(value);
        return Math.abs(val).toString();
    }
}
