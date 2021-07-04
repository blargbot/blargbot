import { BaseSubtag, BBTagContext, parse, SubtagCall, SubtagType } from '../core';

export class DecrementSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'decrement',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['varName'],
                    description: 'Decreases `varName`\'s value by `1`. ',
                    exampleCode: '{set;~counter;0} {repeat;{decrement;~counter},;10}',
                    exampleOut: '-1,-2,-3,-4,-5,-6,-7,-8,-9,-10',
                    execute: (ctx, [{ value }], subtag) => this.decrement(ctx, value, 1, true, subtag)
                },
                {
                    parameters: ['varName', 'amount:1', 'floor?:true'],
                    description: 'Decreases `varName`\'s value by `amount`. ' +
                        '`floor` is a boolean, and if it is `true` then the value will be rounded down.',
                    exampleCode: '{set;~counter;0} {repeat;{decrement;~counter;-2},;10}',
                    exampleOut: '-2,-4,-6,-8,-10,-12,-14,-16,-18,-20',
                    execute: (ctx, [varName, amount, floor], subtag) => this.decrement(ctx, varName.value, parse.float(amount.value), parse.boolean(floor.value), subtag)
                }
            ]
        });
    }

    public async decrement(context: BBTagContext, varName: string, amount: number, floor: boolean | undefined, subtag: SubtagCall): Promise<string> {
        if (isNaN(amount))
            return this.notANumber(context, subtag, 'Amount is not a boolean');

        if (floor === undefined)
            return this.notABoolean(context, subtag, 'Floor is not a boolean');

        let value = await context.variables.get(varName);
        if (['boolean', 'object', 'undefined'].includes(typeof value))
            return this.notANumber(context, subtag, 'Value is not a number');
        value = parse.float(value as string | number);
        if (isNaN(value))
            return this.notANumber(context, subtag, 'Value is not a number');

        if (floor) {
            value = Math.floor(value);
            amount = Math.floor(amount);
        }

        value += amount * -1;
        await context.variables.set(varName, value);

        return value.toString();
    }
}
