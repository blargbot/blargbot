import { BBTagContext, Subtag } from '@cluster/bbtag';
import { NotABooleanError, NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class IncrementSubtag extends Subtag {
    public constructor() {
        super({
            name: 'increment',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['varName'],
                    description: 'Increases `varName`\'s value by `1`. ',
                    exampleCode: '{set;~counter;0} {repeat;{increment;~counter},;10}',
                    exampleOut: '1,2,3,4,5,6,7,8,9,10',
                    execute: (ctx, [varName]) => this.increment(ctx, varName.value, '1', 'true')
                },
                {
                    parameters: ['varName', 'amount:1', 'floor?:true'],
                    description: 'Increases `varName`\'s value by `amount`. ' +
                        '`floor` is a boolean, and if it is `true` then the value will be rounded down.',
                    exampleCode: '{set;~counter;0} {repeat;{increment;~counter;-2},;10}',
                    exampleOut: '2,4,6,8,10,12,14,16,18,20',
                    execute: (ctx, [varName, amount, floor]) => this.increment(ctx, varName.value, amount.value, floor.value)
                }
            ]
        });
    }

    public async increment(context: BBTagContext, varName: string, amountStr: string, floorStr: string): Promise<string> {
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

        value += amount;
        await context.variables.set(varName, value);

        return value.toString();
    }
}
