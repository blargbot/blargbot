import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotABooleanError, NotANumberError } from '../../errors';
import { SubtagType } from '../../utils';

export class DecrementSubtag extends CompiledSubtag {
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
                    returns: 'number',
                    execute: (ctx, [{ value }]) => this.decrement(ctx, value, '1', 'true')
                },
                {
                    parameters: ['varName', 'amount:1', 'floor?:true'],
                    description: 'Decreases `varName`\'s value by `amount`. `floor` is a boolean, and if it is `true` then the value will be rounded down.',
                    exampleCode: '{set;~counter;0} {repeat;{decrement;~counter;-2},;10}',
                    exampleOut: '-2,-4,-6,-8,-10,-12,-14,-16,-18,-20',
                    returns: 'number',
                    execute: (ctx, [varName, amount, floor]) => this.decrement(ctx, varName.value, amount.value, floor.value)
                }
            ]
        });
    }

    public async decrement(context: BBTagContext, varName: string, amountStr: string, floorStr: string): Promise<number> {
        let amount = parse.float(amountStr);
        if (amount === undefined)
            throw new NotANumberError(amountStr);

        const floor = parse.boolean(floorStr);
        if (floor === undefined)
            throw new NotABooleanError(floorStr);

        const valueRaw = await context.variables.get(varName);
        let value: number | undefined;
        switch (typeof valueRaw.value) {
            case 'string':
                value = parse.float(valueRaw.value);
                break;
            case 'number':
                value = valueRaw.value;
                break;
        }
        if (value === undefined)
            throw new NotANumberError(valueRaw.value);

        if (floor) {
            value = Math.floor(value);
            amount = Math.floor(amount);
        }

        value -= amount;
        await context.variables.set(varName, value);

        return value;
    }
}
