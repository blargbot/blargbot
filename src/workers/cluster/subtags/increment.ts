import { BaseSubtag, SubtagType, BBTagContext, parse, SubtagCall } from '../core';

export class IncrementSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'increment',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['varName'],
                    description: 'Increases `varName`\'s value by `1`. ',
                    exampleCode: '{set;~counter;0} {repeat;{increment;~counter},;10}',
                    exampleOut: '1,2,3,4,5,6,7,8,9,10',
                    execute: (ctx, [varName], subtag) => this.increment(ctx, varName.value, 1, true, subtag)
                },
                {
                    parameters: ['varName', 'amount:1', 'floor?:true'],
                    description: 'Increases `varName`\'s value by `amount`. ' +
                        '`floor` is a boolean, and if it is `true` then the value will be rounded down.',
                    exampleCode: '{set;~counter;0} {repeat;{increment;~counter;-2},;10}',
                    exampleOut: '2,4,6,8,10,12,14,16,18,20',
                    execute: (ctx, [varName, amountStr, floorStr], subtag) => this.increment(ctx, varName.value, parse.float(amountStr.value), parse.boolean(floorStr.value), subtag)
                }
            ]
        });
    }

    public async increment(context: BBTagContext, varName: string, amount: number, floor: boolean | undefined, subtag: SubtagCall): Promise<string> {
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

        value += amount;
        await context.variables.set(varName, value);

        return value.toString();
    }
}
