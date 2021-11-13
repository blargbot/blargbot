import { BBTagContext, Subtag } from '@cluster/bbtag';
import { NotABooleanError, NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class DecrementSubtag extends Subtag {
    public constructor() {
        super({
            name: 'decrement',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['varName'],
                    description: 'Decreases `varName`\'s value by `1`. ',
                    exampleCode: '{set;~counter;0} {repeat;{decrement;~counter},;10}',
                    exampleOut: '-1,-2,-3,-4,-5,-6,-7,-8,-9,-10',
                    execute: (ctx, [{ value }]) => this.decrement(ctx, value, '1', 'true')
                },
                {
                    parameters: ['varName', 'amount:1', 'floor?:true'],
                    description: 'Decreases `varName`\'s value by `amount`. ' +
                        '`floor` is a boolean, and if it is `true` then the value will be rounded down.',
                    exampleCode: '{set;~counter;0} {repeat;{decrement;~counter;-2},;10}',
                    exampleOut: '-2,-4,-6,-8,-10,-12,-14,-16,-18,-20',
                    execute: (ctx, [varName, amount, floor]) => this.decrement(ctx, varName.value, amount.value, floor.value)
                }
            ]
        });
    }

    public async decrement(context: BBTagContext, varName: string, amountStr: string, floorStr: string): Promise<string> {
        let amount = parse.float(amountStr, false);
        if (amount === undefined)
            throw new NotANumberError(amountStr);

        const floor = parse.boolean(floorStr);
        if (floor === undefined)
            throw new NotABooleanError(floorStr);

        const valueRaw = await context.variables.get(varName);
        let value;
        switch (typeof valueRaw) {
            case 'string':
                value = parse.float(valueRaw);
                break;
            case 'number':
                value = valueRaw;
                break;
            default:
                value = NaN;
        }
        if (isNaN(value))
            throw new NotANumberError(value);

        if (floor) {
            value = Math.floor(value);
            amount = Math.floor(amount);
        }

        value -= amount;
        await context.variables.set(varName, value);

        return value.toString();
    }
}
